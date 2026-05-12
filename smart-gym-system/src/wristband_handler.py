from __future__ import annotations

import threading
from dataclasses import replace

from .data_stores import MemberHealthProfiles
from .datatypes import BiometricReading, CustomizedHealthThresholds, MemberId, WristbandId, AlertSeverity
from .iot_gateway import IoTGateway
from .data_analytics_engine import DataAnalyticsEngine


class WristbandHandler:
    """
    UC3 assignment: maintain active session and personalized thresholds, then poll the IoT gateway
    for biometric readings (continuous ingestion). UC3 deassignment: unpair, clear session state,
    stop monitoring. Alert routing (UC4) is done via _process_reading comparison.
    """

    _POLL_INTERVAL_SEC = 4.0
    _JOIN_TIMEOUT_SEC = 3.0

    def __init__(self, member_health_profiles: MemberHealthProfiles, iot_gateway: IoTGateway, analytics_engine: DataAnalyticsEngine) -> None:
        self._profiles = member_health_profiles
        self._iot = iot_gateway
        self._analytics = analytics_engine
        self._lock = threading.Lock()
        self.active_sessions: dict[WristbandId, MemberId] = {}
        self.member_thresholds: dict[WristbandId, CustomizedHealthThresholds] = {}
        self.last_reading_by_wristband: dict[WristbandId, BiometricReading] = {}
        self._monitor_threads: dict[WristbandId, threading.Thread] = {}
        self._monitor_stops: dict[WristbandId, threading.Event] = {}

    def list_available_hardware(self) -> list[dict]:
        """Queries the IoT Gateway for autodiscovered hardware boards."""
        return self._iot.discover_available_boards()

    def pairWristband(self, wristband_id: WristbandId, member_id: MemberId, ip_address: str = "", serial_number: str = "") -> None:
        profile = self._profiles.get_profile(member_id)
        if profile is None:
            return

        self._iot.register_wristband(wristband_id, ip_address, serial_number)
        self._stop_monitor(wristband_id)

        with self._lock:
            self.active_sessions[wristband_id] = member_id
            self.member_thresholds[wristband_id] = replace(profile.thresholds)

        stop = threading.Event()
        thread = threading.Thread(
            target=self._poll_loop,
            args=(wristband_id, stop),
            name=f"wristband-poll-{wristband_id}",
            daemon=True,
        )
        with self._lock:
            self._monitor_stops[wristband_id] = stop
            self._monitor_threads[wristband_id] = thread
        thread.start()

    def unpairWristband(self, wristband_id: WristbandId) -> bool:
        with self._lock:
            had_session = wristband_id in self.active_sessions
        if not had_session:
            return False
        self._stop_monitor(wristband_id)
        with self._lock:
            self.active_sessions.pop(wristband_id, None)
            self.member_thresholds.pop(wristband_id, None)
            self.last_reading_by_wristband.pop(wristband_id, None)
        self._iot.unregister_wristband(wristband_id)
        return True

    def _stop_monitor(self, wristband_id: WristbandId) -> None:
        with self._lock:
            stop = self._monitor_stops.pop(wristband_id, None)
            thread = self._monitor_threads.pop(wristband_id, None)
        if stop is not None:
            stop.set()
        if thread is not None and thread.is_alive():
            thread.join(timeout=self._JOIN_TIMEOUT_SEC)

    def _poll_loop(self, wristband_id: WristbandId, stop: threading.Event) -> None:
        while True:
            if stop.wait(timeout=self._POLL_INTERVAL_SEC):
                break
            reading = self._iot.pollWristband(wristband_id)
            self._process_reading(reading)

    def _process_reading(self, reading: BiometricReading) -> None:
        with self._lock:
            self.last_reading_by_wristband[reading.wristband_id] = reading
            thresholds = self.member_thresholds.get(reading.wristband_id)

        if thresholds:
            severity = None
            if reading.heart_rate > thresholds.heart_rate_max or reading.heart_rate < thresholds.heart_rate_min:
                severity = AlertSeverity.WARNING
            elif reading.temperature > thresholds.temperature_max or reading.temperature < thresholds.temperature_min:
                severity = AlertSeverity.WARNING
            
            if severity:
                self._analytics.onBiometricAlert(reading, severity)
