from flask import Blueprint, request, jsonify
from .datatypes import SensorId, WristbandId, EnvironmentalReading, BiometricReading


class IoTGateway:
    """
    Software driver for managing connections from environmental sensors and biometric wristbands.
    """
    def __init__(self) -> None:
        self.connectedSensors: list[SensorId] = []
        self.connectedWristbands: list[WristbandId] = []

    def register_wristband(self, wristband_id: WristbandId) -> None:
        if wristband_id not in self.connectedWristbands:
            self.connectedWristbands.append(wristband_id)

    def unregister_wristband(self, wristband_id: WristbandId) -> None:
        if wristband_id in self.connectedWristbands:
            self.connectedWristbands.remove(wristband_id)

    def pollSensor(self, sensor_id: SensorId) -> EnvironmentalReading:
        pass

    def pollWristband(self, wristband_id: WristbandId) -> BiometricReading:
        pass


def create_iot_blueprint(iot_gateway: IoTGateway) -> Blueprint:
    iot_bp = Blueprint('iot', __name__)

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

    return iot_bp
