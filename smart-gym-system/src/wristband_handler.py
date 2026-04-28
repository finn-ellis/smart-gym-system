from .datatypes import WristbandId, MemberId, CustomizedHealthThresholds

class WristbandHandler:
    """
    Utilizes APIs from IoT Gateway to read from biometric wristbands and log the data to the Data & Analytics Engine.
    """
    def __init__(self) -> None:
        self.activeSessions = {}
        self.memberThresholds = {}

    def pairWristband(self, wristband_id: WristbandId, member_id: MemberId) -> None:
        pass

    def unpairWristband(self, wristband_id: WristbandId) -> None:
        pass
