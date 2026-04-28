from .datatypes import AlertSeverity, AlertId, SensorId, WristbandId, VideoClipId, OccupancyCountsByZone, EnvironmentalReading, BiometricReading

class DataAnalyticsEngine:
    """
    Synthesizes data from the various handlers into the Gym State, Data Stores, and Report Generation Handler.
    Responsible for most data processing and mutation in the system.
    """
    def __init__(self) -> None:
        self.gym_state = None

    def onSensorProcess(self, reading: EnvironmentalReading, severity: AlertSeverity) -> None:
        pass

    def onBiometricAlert(self, reading: BiometricReading, severity: AlertSeverity) -> None:
        pass

    def onVideoAlert(self, severity: AlertSeverity, clip_id: VideoClipId) -> None:
        pass

    def onOccupancyCounted(self, counts: OccupancyCountsByZone) -> None:
        pass

    def dismissAlert(self, alert_id: AlertId) -> None:
        pass
