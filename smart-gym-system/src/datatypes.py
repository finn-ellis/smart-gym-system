from enum import Enum
from typing import Dict, List, Optional, Any

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

class BiometricReading:
    pass

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

class CustomizedHealthThresholds:
    pass
