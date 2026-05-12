import time

from .data_analytics_engine import DataAnalyticsEngine
from .data_stores import VideoClipsArchive
from .datatypes import AlertSeverity, VideoClip, VideoClipId, ZoneId

class MLLMHandler:
    """
    Reads from camera feed, incrementally performs calls to Gemini 3.1 Pro.
    """
    def __init__(
        self,
        video_clips_archive: VideoClipsArchive,
        analytics_engine: DataAnalyticsEngine,
    ) -> None:
        self._video_clips_archive = video_clips_archive
        self._analytics_engine = analytics_engine
        self.connectedCameras: list[ZoneId] = []

    def save_placeholder_clip(self, zone_id: ZoneId = "demo-zone") -> VideoClipId:
        clip = VideoClip(
            clip_id=f"clip-{time.time_ns()}",
            created_at=time.time(),
            uri=f"memory://clips/{zone_id}/{time.time_ns()}",
            metadata={
                "zone_id": zone_id,
                "summary": "Placeholder clip saved for the CS460 demo.",
            },
        )
        self._video_clips_archive.save_clip(clip)
        return clip.clip_id

    def flag_placeholder_video_alert(
        self,
        severity: AlertSeverity = AlertSeverity.WARNING,
        zone_id: ZoneId = "demo-zone",
    ) -> VideoClipId:
        clip_id = self.save_placeholder_clip(zone_id)
        self._analytics_engine.onVideoAlert(severity, clip_id)
        return clip_id
