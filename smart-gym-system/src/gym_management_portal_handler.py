from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from .datatypes import AlertId, ReportId, MemberId, VideoClipId, WristbandId

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

class GymManagementPortalHandler:
    """
    Hosts a web REST and Web Socket API for interaction from the mobile app.
    Handles and routes requests from the mobile app.
    """
    def __init__(self) -> None:
        self.web_socket_connections = []

handler = GymManagementPortalHandler()

# REST Endpoints
@app.route('/api/alerts', methods=['GET'])
def getAlerts():
    pass

@app.route('/api/alerts/<alert_id>', methods=['GET'])
def viewAlert(alert_id: AlertId):
    pass

@app.route('/api/alerts/<alert_id>/dismiss', methods=['POST'])
def dismissAlert(alert_id: AlertId):
    pass

@app.route('/api/reports', methods=['GET'])
def getReports():
    pass

@app.route('/api/reports/<report_id>', methods=['GET'])
def viewReport(report_id: ReportId):
    pass

@app.route('/api/gym_states', methods=['GET'])
def getGymStates():
    pass

@app.route('/api/members/<member_id>', methods=['GET'])
def getMemberProfile(member_id: MemberId):
    pass

@app.route('/api/members/<member_id>', methods=['PUT', 'PATCH'])
def updateMemberProfile(member_id: MemberId):
    pass

@app.route('/api/videos/<clip_id>', methods=['GET'])
def getVideoClip(clip_id: VideoClipId):
    pass

@app.route('/api/wristbands/assign', methods=['POST'])
def assignWristband():
    """ Expects wristband_id and member_id in payload """
    pass

@app.route('/api/wristbands/return', methods=['POST'])
def onWristbandReturned():
    """ Expects wristband_id in payload """
    pass


# WebSocket Events
@socketio.on('subscribeGymState')
def subscribeGymState():
    pass

def start_server():
    socketio.run(app, debug=True)

if __name__ == '__main__':
    start_server()
