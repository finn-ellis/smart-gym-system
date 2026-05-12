from __future__ import annotations

from dataclasses import asdict, replace
from enum import Enum
import threading
import time
from typing import Optional

from flask_socketio import SocketIO

from .data_stores import AlertLog, GymStatesArchive
from .datatypes import (
    AlertId,
    AlertInfo,
    AlertSeverity,
    BiometricReading,
    EnvironmentalReading,
    GymState,
    OccupancyCountsByZone,
    VideoClipId,
)


def _jsonable(value: object) -> object:
    if isinstance(value, Enum):
        return value.value
    if hasattr(value, "__dataclass_fields__"):
        return {key: _jsonable(item) for key, item in asdict(value).items()}
    if isinstance(value, dict):
        return {key: _jsonable(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_jsonable(item) for item in value]
    return value


class DataAnalyticsEngine:
    """
    Synthesizes data from the various handlers into the Gym State, Data Stores, and Report Generation Handler.
    Responsible for most data processing and mutation in the system.
    """
    _SNAPSHOT_INTERVAL_SECONDS = 300

    def __init__(
        self,
        gym_states_archive: GymStatesArchive,
        alert_log: AlertLog,
        socketio: Optional[SocketIO] = None,
    ) -> None:
        self._gym_states_archive = gym_states_archive
        self._alert_log = alert_log
        self._socketio = socketio
        self._lock = threading.Lock()
        self._alert_counter = 0
        self.gym_state: GymState = GymState(timestamp=time.time())
        self._snapshot_thread = threading.Thread(
            target=self._snapshot_loop,
            name="gym-state-archive-snapshot",
            daemon=True,
        )
        self._snapshot_thread.start()

    def broadcastGymState(self) -> None:
        """
        Broadcasts the current gym state to all connected client apps via WebSocket.
        """
        if self._socketio is not None:
            self._socketio.emit("gymStateUpdate", _jsonable(self.gym_state))

    def onSensorProcess(self, reading: EnvironmentalReading, severity: AlertSeverity) -> None:
        zone_key = reading.zone_id or reading.sensor_id or "unknown"
        with self._lock:
            air_quality = dict(self.gym_state.air_quality)
            air_quality[zone_key] = reading.air_quality
            self.gym_state = replace(self.gym_state, timestamp=time.time(), air_quality=air_quality)
        self.raise_alert(
            severity,
            "Environmental sensor alert",
            {
                "type": "environmental",
                "sensor_id": reading.sensor_id,
                "zone_id": reading.zone_id,
            },
        )

    def onBiometricAlert(self, reading: BiometricReading, severity: AlertSeverity) -> None:
        self.raise_alert(
            severity,
            "Biometric threshold alert",
            {
                "type": "biometric",
                "wristband_id": reading.wristband_id,
                "heart_rate": reading.heart_rate,
                "temperature": reading.temperature,
            },
        )

    def onBiometricReading(self, reading: BiometricReading) -> None:
        """
        Broadcasts raw biometric readings to connected clients.
        """
        if self._socketio is not None:
            self._socketio.emit("biometricUpdate", _jsonable(reading))

    def onVideoAlert(self, severity: AlertSeverity, clip_id: VideoClipId) -> None:
        self.raise_alert(
            severity,
            "Video safety alert",
            {"type": "video", "clip_id": clip_id},
        )

    def onOccupancyCounted(self, counts: OccupancyCountsByZone) -> None:
        with self._lock:
            self.gym_state = replace(
                self.gym_state,
                timestamp=time.time(),
                occupancy_counts=dict(counts.counts),
            )
        self.broadcastGymState()

    def dismissAlert(self, alert_id: AlertId) -> None:
        self._alert_log.dismiss_alert(alert_id)
        with self._lock:
            active_alert_ids = [
                current_id
                for current_id in self.gym_state.active_alert_ids
                if current_id != alert_id
            ]
            self.gym_state = replace(
                self.gym_state,
                timestamp=time.time(),
                active_alert_ids=active_alert_ids,
            )
        self.broadcastGymState()

    def raise_alert(
        self,
        severity: AlertSeverity,
        message: str,
        metadata: Optional[dict[str, object]] = None,
    ) -> AlertInfo:
        """Public API to raise a staff-facing alert, persist it, and push it over WebSocket."""
        alert = self._build_alert(severity, message, metadata or {})
        self._alert_log.add_alert(alert)
        with self._lock:
            active_alert_ids = [*self.gym_state.active_alert_ids, alert.alert_id]
            self.gym_state = replace(
                self.gym_state,
                timestamp=time.time(),
                active_alert_ids=active_alert_ids,
            )
        if self._socketio is not None:
            self._socketio.emit("alertCreated", _jsonable(alert))
        self.broadcastGymState()
        return alert

    def _build_alert(
        self,
        severity: AlertSeverity,
        message: str,
        metadata: dict[str, object],
    ) -> AlertInfo:
        with self._lock:
            self._alert_counter += 1
            alert_id = f"alert-{time.time_ns()}-{self._alert_counter}"
        return AlertInfo(
            alert_id=alert_id,
            severity=severity,
            message=message,
            timestamp=time.time(),
            metadata=metadata,
        )

    def _snapshot_loop(self) -> None:
        while True:
            time.sleep(self._SNAPSHOT_INTERVAL_SECONDS)
            with self._lock:
                snapshot = replace(self.gym_state, timestamp=time.time())
            self._gym_states_archive.append(snapshot)
