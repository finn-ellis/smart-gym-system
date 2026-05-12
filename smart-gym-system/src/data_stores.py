"""In-memory stores for the Smart Gym System data-store layer.

The SAD describes five data stores used by the handlers and portal:
Member Health Profiles for member-disclosed thresholds, Gym States Archive for
periodic facility state history, Alert Log for staff-facing alert lookup and
dismissal, Reports Archive for generated management reports, and Video Clips
Archive for abnormality clips linked from alerts and reports.
"""

from dataclasses import fields, replace
import threading
from typing import Any, Optional

from .datatypes import (
    AlertId,
    AlertInfo,
    CustomizedHealthThresholds,
    GymState,
    MemberId,
    MemberProfile,
    Report,
    ReportId,
    VideoClip,
    VideoClipId,
)


def _require_attr(item: object, attr_name: str, store_name: str) -> Any:
    try:
        value = getattr(item, attr_name)
    except AttributeError as exc:
        raise ValueError(
            f"{store_name} entries must define {attr_name!r}."
        ) from exc
    if value == "":
        raise ValueError(f"{store_name} entries must have a non-empty {attr_name}.")
    return value


def _timestamp(item: object, store_name: str) -> float:
    for attr_name in ("timestamp", "created_at"):
        if hasattr(item, attr_name):
            return float(getattr(item, attr_name))
    raise ValueError(
        f"{store_name} entries must define 'timestamp' or 'created_at'."
    )


def _normalized_limit(limit: int) -> int:
    return max(0, limit)


class MemberHealthProfiles:
    def __init__(self, profiles: Optional[list[MemberProfile]] = None) -> None:
        """Initialize the SAD Member Health Profiles store in memory."""
        self._lock = threading.Lock()
        self._profiles: dict[MemberId, MemberProfile] = {}
        for profile in profiles or []:
            self._profiles[profile.member_id] = profile

    def get_profile(self, member_id: MemberId) -> MemberProfile:
        """Return a member profile as required by the SAD portal/profile flow."""
        with self._lock:
            try:
                return self._profiles[member_id]
            except KeyError as exc:
                raise KeyError(
                    f"Member Health Profiles has no member {member_id!r}."
                ) from exc

    def update_profile(
        self, member_id: MemberId, data: dict[str, Any]
    ) -> MemberProfile:
        """Update SAD member-disclosed health data and custom thresholds."""
        with self._lock:
            try:
                profile = self._profiles[member_id]
            except KeyError as exc:
                raise KeyError(
                    f"Member Health Profiles cannot update unknown member "
                    f"{member_id!r}."
                ) from exc

            updates: dict[str, Any] = {}
            profile_fields = {field.name for field in fields(MemberProfile)}
            for key, value in data.items():
                if key in profile_fields and key not in {"member_id", "thresholds"}:
                    updates[key] = value

            if "thresholds" in data:
                updates["thresholds"] = self._merge_thresholds(
                    profile.thresholds, data["thresholds"]
                )

            updated = replace(profile, **updates)
            self._profiles[member_id] = updated
            return updated

    def list_profiles(self) -> list[MemberProfile]:
        """List profiles for the SAD Member Health Profiles data store."""
        with self._lock:
            return list(self._profiles.values())

    def _merge_thresholds(
        self,
        current: CustomizedHealthThresholds,
        new_data: object,
    ) -> CustomizedHealthThresholds:
        """Merge SAD custom threshold updates into an existing member profile."""
        if isinstance(new_data, CustomizedHealthThresholds):
            return new_data
        if not isinstance(new_data, dict):
            raise ValueError("thresholds must be an object or CustomizedHealthThresholds.")

        values = {field.name: getattr(current, field.name) for field in fields(current)}
        for key, value in new_data.items():
            if key in values:
                values[key] = value
        return CustomizedHealthThresholds(**values)

class GymStatesArchive:
    def __init__(self) -> None:
        """Initialize the SAD Gym States Archive with a bounded history."""
        self._lock = threading.Lock()
        self._states: list[GymState] = []
        self._max_entries = 10_000

    def append(self, gym_state: GymState) -> GymState:
        """Append a periodic gym-state record described by the SAD."""
        with self._lock:
            self._states.append(gym_state)
            if len(self._states) > self._max_entries:
                del self._states[: len(self._states) - self._max_entries]
            return gym_state

    def get_range(self, start: float, end: float) -> list[GymState]:
        """Return SAD gym-state history whose timestamps fall in a time range."""
        with self._lock:
            return [
                state
                for state in self._states
                if start <= _timestamp(state, "Gym States Archive") <= end
            ]

    def get_latest(self) -> Optional[GymState]:
        """Return the latest SAD gym-state archive entry, if one exists."""
        with self._lock:
            if not self._states:
                return None
            return self._states[-1]

class ReportsArchive:
    def __init__(self) -> None:
        """Initialize the SAD Reports Archive in memory."""
        self._lock = threading.Lock()
        self._reports: dict[ReportId, Report] = {}
        self._order: list[ReportId] = []

    def save_report(self, report: Report) -> Report:
        """Save a generated report for SAD management report browsing."""
        report_id = _require_attr(report, "report_id", "Reports Archive")
        with self._lock:
            if report_id not in self._reports:
                self._order.append(report_id)
            self._reports[report_id] = report
            return report

    def get_report(self, report_id: ReportId) -> Report:
        """Return a SAD archived report by report identifier."""
        with self._lock:
            try:
                return self._reports[report_id]
            except KeyError as exc:
                raise KeyError(
                    f"Reports Archive has no report {report_id!r}."
                ) from exc

    def list_reports(self, limit: int = 50) -> list[Report]:
        """List recent SAD reports for portal report browsing."""
        with self._lock:
            normalized_limit = _normalized_limit(limit)
            if normalized_limit == 0:
                return []
            ids = self._order[-normalized_limit:]
            return [self._reports[report_id] for report_id in reversed(ids)]

class VideoClipsArchive:
    def __init__(self) -> None:
        """Initialize the SAD Video Clips Archive in memory."""
        self._lock = threading.Lock()
        self._clips: dict[VideoClipId, VideoClip] = {}

    def save_clip(self, clip: VideoClip) -> VideoClip:
        """Save an abnormality clip for SAD alert/report playback."""
        clip_id = _require_attr(clip, "clip_id", "Video Clips Archive")
        with self._lock:
            self._clips[clip_id] = clip
            return clip

    def get_clip(self, clip_id: VideoClipId) -> VideoClip:
        """Return a SAD video clip by clip identifier."""
        with self._lock:
            try:
                return self._clips[clip_id]
            except KeyError as exc:
                raise KeyError(
                    f"Video Clips Archive has no clip {clip_id!r}."
                ) from exc

class AlertLog:
    def __init__(self) -> None:
        """Initialize the SAD Alert Log in memory."""
        self._lock = threading.Lock()
        self._alerts: dict[AlertId, AlertInfo] = {}
        self._order: list[AlertId] = []

    def add_alert(self, alert: AlertInfo) -> AlertInfo:
        """Add a staff-facing alert to the SAD Alert Log."""
        alert_id = _require_attr(alert, "alert_id", "Alert Log")
        with self._lock:
            if alert_id not in self._alerts:
                self._order.append(alert_id)
            self._alerts[alert_id] = alert
            return alert

    def get_alert(self, alert_id: AlertId) -> AlertInfo:
        """Return a single SAD alert for portal detail viewing."""
        with self._lock:
            try:
                return self._alerts[alert_id]
            except KeyError as exc:
                raise KeyError(f"Alert Log has no alert {alert_id!r}.") from exc

    def get_alerts(
        self,
        start: Optional[float] = None,
        end: Optional[float] = None,
        limit: int = 100,
    ) -> list[AlertInfo]:
        """Query SAD alerts by optional time range for portal browsing."""
        with self._lock:
            alerts = [
                self._alerts[alert_id]
                for alert_id in reversed(self._order)
                if self._is_in_range(self._alerts[alert_id], start, end)
            ]
            return alerts[: _normalized_limit(limit)]

    def dismiss_alert(self, alert_id: AlertId) -> AlertInfo:
        """Mark a SAD alert dismissed after staff handles it in the portal."""
        with self._lock:
            try:
                alert = self._alerts[alert_id]
            except KeyError as exc:
                raise KeyError(f"Alert Log has no alert {alert_id!r}.") from exc

            dismissed = replace(alert, dismissed=True)
            self._alerts[alert_id] = dismissed
            return dismissed

    def _is_in_range(
        self,
        alert: AlertInfo,
        start: Optional[float],
        end: Optional[float],
    ) -> bool:
        """Check whether a SAD alert timestamp is within a portal query range."""
        timestamp = _timestamp(alert, "Alert Log")
        if start is not None and timestamp < start:
            return False
        return not (end is not None and timestamp > end)
