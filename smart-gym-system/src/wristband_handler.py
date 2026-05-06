from __future__ import annotations

import threading
from dataclasses import replace

from .data_stores import MemberHealthProfiles
from .datatypes import BiometricReading, CustomizedHealthThresholds, MemberId, WristbandId
from .iot_gateway import IoTGateway


class WristbandHandler:
    """
    UC3 steps 6–8: maintain active session and personalized thresholds, then poll the IoT gateway
    for biometric readings (continuous ingestion). Alert routing (UC4) is not done here.
    """

    _POLL_INTERVAL_SEC = 4.0
    _JOIN_TIMEOUT_SEC = 3.0

    def __init__(self, member_health_profiles: MemberHealthProfiles, iot_gateway: IoTGateway) -> None:
        self._profiles = member_health_profiles
        self._iot = iot_gateway
        self._lock = threading.Lock()
        self.active_sessions: dict[WristbandId, MemberId] = {}
        self.member_thresholds: dict[WristbandId, CustomizedHealthThresholds] = {}
        self.last_reading_by_wristband: dict[WristbandId, BiometricReading] = {}
        self._monitor_threads: dict[WristbandId, threading.Thread] = {}
        self._monitor_stops: dict[WristbandId, threading.Event] = {}

    def pairWristband(self, wristband_id: WristbandId, member_id: MemberId) -> None:
        profile = self._profiles.get_profile(member_id)
        if profile is None:
            return

        self._iot.register_wristband(wristband_id)
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
