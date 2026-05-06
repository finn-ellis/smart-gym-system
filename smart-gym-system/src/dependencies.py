"""Process-wide singletons for handler collaboration (demo / single-process deployment)."""

from .data_stores import MemberHealthProfiles
from .wristband_handler import WristbandHandler

member_health_profiles = MemberHealthProfiles()
wristband_handler = WristbandHandler()
