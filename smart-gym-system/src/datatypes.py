from enum import Enum
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

# Identifiers
SensorId = str
WristbandId = str
ZoneId = str
MemberId = str
AlertId = str
ReportId = str
VideoClipId = str

class AlertSeverity(Enum):
    INFORMATIONAL = "Informational"
    WARNING = "Warning"
    CRITICAL = "Critical"

class ReportType(Enum):
    HOURLY = "Hourly"
    DAILY = "Daily"
    WEEKLY = "Weekly"
    MONTHLY = "Monthly"

class StatusLevel(Enum):
    NORMAL = "Normal"
    WARNING = "Warning"
    CRITICAL = "Critical"

class ThresholdConfig:
    pass

class AirQualityReading:
    pass

class EnvironmentalReading:
    pass

@dataclass(frozen=True)
class BiometricReading:
    wristband_id: WristbandId
    heart_rate: float
    ppg: List[float]
    eda: float
    temperature: float

class GymState:
    pass

class AlertInfo:
    pass

class Report:
    pass

class ReportInfo:
    pass

class MemberProfile:
    pass

class VideoClip:
    pass

class OccupancyCountsByZone:
    pass

class MetricsLoad:
    pass

@dataclass(frozen=True)
class CustomizedHealthThresholds:
    heart_rate_max: float = 180.0
    heart_rate_min: float = 40.0
    temperature_max: float = 38.0
    temperature_min: float = 35.0
