from __future__ import annotations

from .datatypes import MemberId, WristbandId


class WristbandHandler:
    """
    UC3 steps 6+ (session state, thresholds, IoT polling) are out of scope here.
    Step 5 only: invoked by the Gym Management Portal Handler after assignWristband.
    """

    def pairWristband(self, wristband_id: WristbandId, member_id: MemberId) -> None:
        pass
