"""Process-wide singletons for handler collaboration (demo / single-process deployment)."""

from .data_stores import MemberHealthProfiles
from .iot_gateway import IoTGateway
from .wristband_handler import WristbandHandler

member_health_profiles = MemberHealthProfiles()
iot_gateway = IoTGateway()
wristband_handler = WristbandHandler(member_health_profiles, iot_gateway)
