from .datatypes import ZoneId, SensorId, ThresholdConfig, AirQualityReading, StatusLevel

class EnvironmentalSensorHandler:
    """
    Utilizes APIs from IoT Gateway to read from environmental sensors and log the data to the Data & Analytics Engine.
    """
    def __init__(self) -> None:
        self.zoneThresholds = {}
        self.currentReadings = {}
        self.zoneStatus = {}
