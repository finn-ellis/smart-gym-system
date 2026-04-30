from flask import Blueprint, request, jsonify
from .app import socketio
from .datatypes import AlertId, ReportId, MemberId, VideoClipId, WristbandId

portal_bp = Blueprint('portal', __name__)

class GymManagementPortalHandler:
    """
    Hosts a web REST and Web Socket API for interaction from the mobile app.
    Handles and routes requests from the mobile app.
    """
    def __init__(self) -> None:
        self.web_socket_connections = []

handler = GymManagementPortalHandler()

# REST Endpoints
@portal_bp.route('/alerts', methods=['GET'])
def getAlerts():
    pass

@portal_bp.route('/alerts/<alert_id>', methods=['GET'])
def viewAlert(alert_id: AlertId):
    pass

@portal_bp.route('/alerts/<alert_id>/dismiss', methods=['POST'])
def dismissAlert(alert_id: AlertId):
    pass

@portal_bp.route('/reports', methods=['GET'])
def getReports():
    pass

@portal_bp.route('/reports/<report_id>', methods=['GET'])
def viewReport(report_id: ReportId):
    pass

@portal_bp.route('/gym_states', methods=['GET'])
def getGymStates():
    pass

@portal_bp.route('/members/<member_id>', methods=['GET'])
def getMemberProfile(member_id: MemberId):
    pass

@portal_bp.route('/members/<member_id>', methods=['PUT', 'PATCH'])
def updateMemberProfile(member_id: MemberId):
    pass

@portal_bp.route('/videos/<clip_id>', methods=['GET'])
def getVideoClip(clip_id: VideoClipId):
    pass

@portal_bp.route('/wristbands/assign', methods=['POST'])
def assignWristband():
    """ Expects wristband_id and member_id in payload """
    pass

@portal_bp.route('/wristbands/return', methods=['POST'])
def onWristbandReturned():
    """ Expects wristband_id in payload """
    pass


# WebSocket Events
@socketio.on('subscribeGymState')
def subscribeGymState():
    pass
