from flask import Blueprint, request, jsonify
from .datatypes import SensorId, WristbandId, EnvironmentalReading, BiometricReading

iot_bp = Blueprint('iot', __name__)

class IoTGateway:
    """
    Software driver for managing connections from environmental sensors and biometric wristbands.
    """
    def __init__(self) -> None:
        self.connectedSensors = []
        self.connectedWristbands = []

    def pollSensor(self, sensor_id: SensorId) -> EnvironmentalReading:
        pass

    def pollWristband(self, wristband_id: WristbandId) -> BiometricReading:
        pass

@iot_bp.route('/register', methods=['POST'])
def register_device():
    """
    Endpoint for IoT devices to register themselves with the gateway.
    """
    return jsonify({"status": "success", "message": "Device registered"})

@iot_bp.route('/telemetry', methods=['POST'])
def receive_telemetry():
    """
    Endpoint for IoT devices to push sensor readings.
    """
    data = request.json
    return jsonify({"status": "received", "data": data})
