from .datatypes import ZoneId, VideoClipId

class MLLMHandler:
    """
    Reads from camera feed, incrementally performs calls to Gemini 3.1 Pro.
    """
    def __init__(self) -> None:
        self.connectedCameras = []
