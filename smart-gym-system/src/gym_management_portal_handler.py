from dataclasses import asdict
from enum import Enum
from typing import Optional
import threading
import time

from flask import Blueprint, jsonify, request
from flask_socketio import SocketIO

from .data_analytics_engine import DataAnalyticsEngine
from .data_stores import (
    AlertLog,
    GymStatesArchive,
    MemberHealthProfiles,
    ReportsArchive,
    VideoClipsArchive,
)
from .wristband_handler import WristbandHandler
from .datatypes import AlertId, AlertSeverity, MemberId, ReportId, VideoClipId


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


class GymManagementPortalHandler:
    """
    Hosts a web REST and Web Socket API for interaction from the mobile app.
    Handles and routes requests from the mobile app.
    """

    def __init__(
        self,
        member_health_profiles: MemberHealthProfiles,
        alert_log: AlertLog,
        reports_archive: ReportsArchive,
        gym_states_archive: GymStatesArchive,
        video_clips_archive: VideoClipsArchive,
        analytics_engine: DataAnalyticsEngine,
        wristband_handler: WristbandHandler,
        socketio: SocketIO,
    ) -> None:
        self.member_health_profiles = member_health_profiles
        self.alert_log = alert_log
        self.reports_archive = reports_archive
        self.gym_states_archive = gym_states_archive
        self.video_clips_archive = video_clips_archive
        self.analytics_engine = analytics_engine
        self.wristband_handler = wristband_handler
        self.socketio = socketio
        self.web_socket_connections: list[object] = []

        self._scan_thread = threading.Thread(target=self._scan_boards_loop, daemon=True)
        self._scan_thread.start()

    def _scan_boards_loop(self):
        while True:
            # Poll for available boards periodically
            boards = self.wristband_handler.list_available_hardware()
            self.socketio.emit("available_boards_update", boards)
            time.sleep(5.0)


def create_portal_blueprint(
    member_health_profiles: MemberHealthProfiles,
    alert_log: AlertLog,
    reports_archive: ReportsArchive,
    gym_states_archive: GymStatesArchive,
    video_clips_archive: VideoClipsArchive,
    analytics_engine: DataAnalyticsEngine,
    wristband_handler: WristbandHandler,
    socketio: SocketIO,
) -> Blueprint:
    portal_bp = Blueprint("portal", __name__)
    handler = GymManagementPortalHandler(
        member_health_profiles,
        alert_log,
        reports_archive,
        gym_states_archive,
        video_clips_archive,
        analytics_engine,
        wristband_handler,
        socketio,
    )

    def _require_json_object() -> dict:
        body = request.get_json(silent=True)
        if not isinstance(body, dict):
            raise ValueError("expected JSON body with an object")
        return body

    def _optional_float(name: str) -> Optional[float]:
        value = request.args.get(name)
        if value is None or value == "":
            return None
        return float(value)

    def _limit(default: int) -> int:
        value = request.args.get("limit")
        if value is None or value == "":
            return default
        return int(value)

    # REST Endpoints
    @portal_bp.route("/alerts", methods=["GET"])
    def getAlerts():
        try:
            alerts = handler.alert_log.get_alerts(
                start=_optional_float("start"),
                end=_optional_float("end"),
                limit=_limit(100),
            )
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        return jsonify(_jsonable(alerts))

    @portal_bp.route("/alerts", methods=["POST"])
    def createAlert():
        """Raise a staff-facing alert directly via the REST API."""
        try:
            body = _require_json_object()
        except ValueError as e:
            return jsonify({"error": str(e)}), 400

        severity_raw = body.get("severity", "Warning")
        try:
            severity = AlertSeverity(severity_raw)
        except ValueError:
            return jsonify({"error": f"Invalid severity {severity_raw!r}. Choose from: {[s.value for s in AlertSeverity]}"}), 400

        message = body.get("message", "")
        if not isinstance(message, str) or not message.strip():
            return jsonify({"error": "message is required"}), 400

        metadata = body.get("metadata", {})
        if not isinstance(metadata, dict):
            return jsonify({"error": "metadata must be an object"}), 400

        alert = handler.analytics_engine.raise_alert(severity, message.strip(), metadata)
        return jsonify({"ok": True, "alert": _jsonable(alert)}), 201

    @portal_bp.route("/alerts/<alert_id>", methods=["GET"])
    def viewAlert(alert_id: AlertId):
        try:
            return jsonify(_jsonable(handler.alert_log.get_alert(alert_id)))
        except KeyError:
            return jsonify({"error": "alert not found"}), 404

    @portal_bp.route("/alerts/<alert_id>/dismiss", methods=["POST"])
    def dismissAlert(alert_id: AlertId):
        try:
            handler.analytics_engine.dismissAlert(alert_id)
        except KeyError:
            return jsonify({"error": "alert not found"}), 404
        return jsonify({"ok": True})

    @portal_bp.route("/reports", methods=["GET"])
    def getReports():
        try:
            reports = handler.reports_archive.list_reports(limit=_limit(50))
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        return jsonify(_jsonable(reports))

    @portal_bp.route("/reports/<report_id>", methods=["GET"])
    def viewReport(report_id: ReportId):
        try:
            return jsonify(_jsonable(handler.reports_archive.get_report(report_id)))
        except KeyError:
            return jsonify({"error": "report not found"}), 404

    @portal_bp.route("/gym_states", methods=["GET"])
    def getGymStates():
        try:
            start = _optional_float("start")
            end = _optional_float("end")
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        if start is None or end is None:
            latest = handler.gym_states_archive.get_latest()
            return jsonify(_jsonable([] if latest is None else [latest]))
        return jsonify(_jsonable(handler.gym_states_archive.get_range(start, end)))

    @portal_bp.route("/wristbands/available", methods=["GET"])
    def listAvailableBoards():
        """Lists boards discovered by the IoT Gateway."""
        boards = handler.wristband_handler.list_available_hardware()
        return jsonify(boards)

    @portal_bp.route("/members", methods=["GET"])
    def listMembers():
        member_ids = handler.member_health_profiles.list_member_ids()
        return jsonify({"member_ids": member_ids})

    @portal_bp.route("/members", methods=["POST"])
    def registerMember():
        from .datatypes import MemberProfile
        try:
            body = _require_json_object()
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        
        member_id = body.get("member_id")
        if not member_id:
            return jsonify({"error": "member_id is required"}), 400
        
        try:
            if handler.member_health_profiles.get_profile(member_id):
                return jsonify({"error": "member already exists"}), 400
        except KeyError:
            pass

        profile = MemberProfile(
            member_id=member_id,
            name=body.get("name", ""),
            age=body.get("age", 0),
            weight_kg=body.get("weight_kg", 0.0),
            medical_history=body.get("medical_history", "")
        )
        handler.member_health_profiles.add_profile(profile)
        return jsonify({"ok": True, "profile": _jsonable(profile)}), 201

    @portal_bp.route("/members/<member_id>", methods=["GET"])
    def getMemberProfile(member_id: MemberId):
        try:
            profile = handler.member_health_profiles.get_profile(member_id)
        except KeyError:
            return jsonify({"error": "member not found"}), 404
        return jsonify(_jsonable(profile))

    @portal_bp.route("/members/<member_id>", methods=["PUT", "PATCH"])
    def updateMemberProfile(member_id: MemberId):
        try:
            body = _require_json_object()
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        try:
            profile = handler.member_health_profiles.update_profile(member_id, body)
        except KeyError:
            return jsonify({"error": "member not found"}), 404
        return jsonify({"ok": True, "profile": _jsonable(profile)})

    @portal_bp.route("/members/<member_id>", methods=["DELETE"])
    def removeMember(member_id: MemberId):
        if handler.member_health_profiles.remove_profile(member_id):
            return jsonify({"ok": True})
        return jsonify({"error": "member not found"}), 404

    @portal_bp.route("/videos/<clip_id>", methods=["GET"])
    def getVideoClip(clip_id: VideoClipId):
        try:
            return jsonify(_jsonable(handler.video_clips_archive.get_clip(clip_id)))
        except KeyError:
            return jsonify({"error": "video clip not found"}), 404

    @portal_bp.route("/wristbands/assign", methods=["POST"])
    def assignWristband():
        """Expects wristband_id, member_id, and optional ip_address/serial_number in payload."""
        try:
            body = _require_json_object()
        except ValueError as e:
            return jsonify({"error": str(e)}), 400

        wristband_id = body.get("wristband_id")
        member_id = body.get("member_id")
        ip_address = body.get("ip_address", "")
        serial_number = body.get("serial_number", "")

        if not isinstance(wristband_id, str) or not wristband_id.strip():
            return jsonify({"error": "wristband_id is required"}), 400
        if not isinstance(member_id, str) or not member_id.strip():
            return jsonify({"error": "member_id is required"}), 400

        wristband_id = wristband_id.strip()
        member_id = member_id.strip()

        if handler.member_health_profiles.get_profile(member_id) is None:
            return jsonify({"error": "member not found"}), 404

        handler.wristband_handler.pairWristband(wristband_id, member_id, ip_address, serial_number)
        _broadcast_wristbands()

        return jsonify({"ok": True, "wristband_id": wristband_id, "member_id": member_id})

    @portal_bp.route("/wristbands/return", methods=["POST"])
    def onWristbandReturned():
        """UC3 deassignment: stop biometric monitoring for a returned wristband."""
        try:
            body = _require_json_object()
        except ValueError as e:
            return jsonify({"error": str(e)}), 400

        wristband_id = body.get("wristband_id")
        if not isinstance(wristband_id, str) or not wristband_id.strip():
            return jsonify({"error": "wristband_id is required"}), 400

        wristband_id = wristband_id.strip()

        if not handler.wristband_handler.unpairWristband(wristband_id):
            return jsonify({"error": "wristband not in an active session"}), 404

        _broadcast_wristbands()
        return jsonify({"ok": True, "wristband_id": wristband_id})

    # WebSocket Events
    @socketio.on("subscribeGymState")
    def subscribeGymState():
        handler.socketio.emit("gymStateUpdate", _jsonable(handler.analytics_engine.gym_state))

    @socketio.on("subscribeWristbands")
    def subscribeWristbands():
        _broadcast_wristbands()
        # Also broadcast available boards immediately on subscribe
        boards = handler.wristband_handler.list_available_hardware()
        socketio.emit("available_boards_update", boards)

    def _broadcast_wristbands():
        sessions = handler.wristband_handler.active_sessions
        payload = [{"wristband_id": wid, "member_id": mid} for wid, mid in sessions.items()]
        socketio.emit("wristbands_update", {"active_sessions": payload})

    return portal_bp
