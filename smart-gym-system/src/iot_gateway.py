from .datatypes import SensorId, WristbandId, EnvironmentalReading, BiometricReading

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
