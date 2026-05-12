from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional

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


# The SAD defines these handler payloads at an architectural level. These
# minimal dataclasses keep the demo implementation typed without committing to
# hardware-specific schemas before the CS460 sensor integrations are complete.
@dataclass(frozen=True)
class ThresholdConfig:
    limits: Dict[str, float] = field(default_factory=dict)


@dataclass(frozen=True)
class AirQualityReading:
    sensor_id: SensorId = ""
    zone_id: ZoneId = ""
    timestamp: float = 0.0
    metrics: Dict[str, float] = field(default_factory=dict)


@dataclass(frozen=True)
class EnvironmentalReading:
    sensor_id: SensorId = ""
    zone_id: ZoneId = ""
    timestamp: float = 0.0
    air_quality: AirQualityReading = field(default_factory=AirQualityReading)

@dataclass(frozen=True)
class BiometricReading:
    wristband_id: WristbandId
    heart_rate: float
    ppg: List[float]
    eda: float
    temperature: float

@dataclass(frozen=True)
class CustomizedHealthThresholds:
    heart_rate_max: float = 180.0
    heart_rate_min: float = 40.0
    temperature_max: float = 38.0
    temperature_min: float = 35.0


# The SAD names these persisted objects but leaves their exact schemas open.
# These minimal dataclasses provide the IDs/timestamps needed by the archives.
@dataclass(frozen=True)
class GymState:
    timestamp: float = 0.0
    air_quality: Dict[ZoneId, Any] = field(default_factory=dict)
    occupancy_counts: Dict[ZoneId, int] = field(default_factory=dict)
    active_alert_ids: List[AlertId] = field(default_factory=list)


@dataclass(frozen=True)
class AlertInfo:
    alert_id: AlertId
    severity: AlertSeverity = AlertSeverity.INFORMATIONAL
    message: str = ""
    timestamp: float = 0.0
    dismissed: bool = False
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class Report:
    report_id: ReportId
    report_type: Optional[ReportType] = None
    title: str = ""
    created_at: float = 0.0
    data: Dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class ReportInfo:
    report_id: ReportId = ""
    report_type: Optional[ReportType] = None
    title: str = ""
    created_at: float = 0.0

@dataclass(frozen=True)
class MemberProfile:
    member_id: MemberId
    display_name: str = ""
    notes: str = ""
    thresholds: CustomizedHealthThresholds = field(
        default_factory=CustomizedHealthThresholds
    )

@dataclass(frozen=True)
class VideoClip:
    clip_id: VideoClipId
    created_at: float = 0.0
    uri: str = ""
    content_type: str = "video/mp4"
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class OccupancyCountsByZone:
    counts: Dict[ZoneId, int] = field(default_factory=dict)


@dataclass(frozen=True)
class MetricsLoad:
    timestamp: float = 0.0
    metrics: Dict[str, Any] = field(default_factory=dict)
