from dataclasses import asdict

from flask import Blueprint, jsonify, request

from .app import socketio
from .dependencies import member_health_profiles, wristband_handler
from .datatypes import AlertId, MemberId, ReportId, VideoClipId

portal_bp = Blueprint("portal", __name__)


class GymManagementPortalHandler:
    """
    Hosts a web REST and Web Socket API for interaction from the mobile app.
    Handles and routes requests from the mobile app.
    """

    def __init__(self) -> None:
        self.web_socket_connections: list[object] = []


handler = GymManagementPortalHandler()


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


@portal_bp.route("/members/<member_id>", methods=["GET"])
def getMemberProfile(member_id: MemberId):
    profile = member_health_profiles.get_profile(member_id)
    if profile is None:
        return jsonify({"error": "member not found"}), 404
    return jsonify(asdict(profile))


@portal_bp.route("/members/<member_id>", methods=["PUT", "PATCH"])
def updateMemberProfile(member_id: MemberId):
    try:
        body = _require_json_object()
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    profile = member_health_profiles.update_profile(member_id, body)
    return jsonify({"ok": True, "profile": asdict(profile)})


@portal_bp.route("/videos/<clip_id>", methods=["GET"])
def getVideoClip(clip_id: VideoClipId):
    pass


@portal_bp.route("/wristbands/assign", methods=["POST"])
def assignWristband():
    """Expects wristband_id and member_id in payload."""
    try:
        body = _require_json_object()
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    wristband_id = body.get("wristband_id")
    member_id = body.get("member_id")
    if not isinstance(wristband_id, str) or not wristband_id.strip():
        return jsonify({"error": "wristband_id is required"}), 400
    if not isinstance(member_id, str) or not member_id.strip():
        return jsonify({"error": "member_id is required"}), 400

    wristband_id = wristband_id.strip()
    member_id = member_id.strip()

    if member_health_profiles.get_profile(member_id) is None:
        return jsonify({"error": "member not found"}), 404

    wristband_handler.pairWristband(wristband_id, member_id)

    return jsonify({"ok": True, "wristband_id": wristband_id, "member_id": member_id})


# WebSocket Events
@socketio.on("subscribeGymState")
def subscribeGymState():
    pass
