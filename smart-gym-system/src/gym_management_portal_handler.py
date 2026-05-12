from dataclasses import asdict

from flask import Blueprint, jsonify, request
from flask_socketio import SocketIO

from .data_stores import MemberHealthProfiles
from .wristband_handler import WristbandHandler
from .datatypes import AlertId, MemberId, ReportId, VideoClipId, MemberProfile


class GymManagementPortalHandler:
    """
    Hosts a web REST and Web Socket API for interaction from the mobile app.
    Handles and routes requests from the mobile app.
    """

    def __init__(
        self,
        member_health_profiles: MemberHealthProfiles,
        wristband_handler: WristbandHandler,
        socketio: SocketIO,
    ) -> None:
        self.member_health_profiles = member_health_profiles
        self.wristband_handler = wristband_handler
        self.socketio = socketio
        self.web_socket_connections: list[object] = []


def create_portal_blueprint(
    member_health_profiles: MemberHealthProfiles,
    wristband_handler: WristbandHandler,
    socketio: SocketIO,
) -> Blueprint:
    portal_bp = Blueprint("portal", __name__)
    handler = GymManagementPortalHandler(
        member_health_profiles, wristband_handler, socketio
    )

    def _require_json_object() -> dict:
        body = request.get_json(silent=True)
        if not isinstance(body, dict):
            raise ValueError("expected JSON body with an object")
        return body

    # REST Endpoints
    @portal_bp.route("/alerts", methods=["GET"])
    def getAlerts():
        pass

    @portal_bp.route("/alerts/<alert_id>", methods=["GET"])
    def viewAlert(alert_id: AlertId):
        pass

    @portal_bp.route("/alerts/<alert_id>/dismiss", methods=["POST"])
    def dismissAlert(alert_id: AlertId):
        pass

    @portal_bp.route("/reports", methods=["GET"])
    def getReports():
        pass

    @portal_bp.route("/reports/<report_id>", methods=["GET"])
    def viewReport(report_id: ReportId):
        pass

    @portal_bp.route("/gym_states", methods=["GET"])
    def getGymStates():
        pass

    @portal_bp.route("/wristbands/available", methods=["GET"])
    def listAvailableBoards():
        """Lists boards discovered by the IoT Gateway via BrainFlow."""
        boards = handler.wristband_handler.list_available_hardware()
        return jsonify(boards)

    @portal_bp.route("/members", methods=["GET"])
    def listMembers():
        member_ids = handler.member_health_profiles.list_member_ids()
        return jsonify({"member_ids": member_ids})

    @portal_bp.route("/members", methods=["POST"])
    def registerMember():
        try:
            body = _require_json_object()
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        
        member_id = body.get("member_id")
        if not member_id:
            return jsonify({"error": "member_id is required"}), 400
        
        if handler.member_health_profiles.get_profile(member_id):
            return jsonify({"error": "member already exists"}), 400

        profile = MemberProfile(
            member_id=member_id,
            name=body.get("name", ""),
            age=body.get("age", 0),
            weight_kg=body.get("weight_kg", 0.0),
            medical_history=body.get("medical_history", "")
        )
        handler.member_health_profiles.add_profile(profile)
        return jsonify({"ok": True, "profile": asdict(profile)}), 201

    @portal_bp.route("/members/<member_id>", methods=["GET"])
    def getMemberProfile(member_id: MemberId):
        profile = handler.member_health_profiles.get_profile(member_id)
        if profile is None:
            return jsonify({"error": "member not found"}), 404
        return jsonify(asdict(profile))

    @portal_bp.route("/members/<member_id>", methods=["PUT", "PATCH"])
    def updateMemberProfile(member_id: MemberId):
        try:
            body = _require_json_object()
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        profile = handler.member_health_profiles.update_profile(member_id, body)
        return jsonify({"ok": True, "profile": asdict(profile)})

    @portal_bp.route("/members/<member_id>", methods=["DELETE"])
    def removeMember(member_id: MemberId):
        if handler.member_health_profiles.remove_profile(member_id):
            return jsonify({"ok": True})
        return jsonify({"error": "member not found"}), 404

    @portal_bp.route("/videos/<clip_id>", methods=["GET"])
    def getVideoClip(clip_id: VideoClipId):
        pass

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

        return jsonify({"ok": True, "wristband_id": wristband_id})

    # WebSocket Events
    @socketio.on("subscribeGymState")
    def subscribeGymState():
        pass

    return portal_bp
