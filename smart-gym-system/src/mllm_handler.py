import logging
import os
import tempfile
import time
from typing import Optional

from .data_analytics_engine import DataAnalyticsEngine
from .data_stores import VideoClipsArchive
from .datatypes import AlertSeverity, VideoClip, VideoClipId, ZoneId

_GEMINI_ANALYSIS_PROMPT = (
    "You are a safety monitoring system for a gym. Analyze this short video clip "
    "from a gym security camera. Determine if there is a safety emergency, such as "
    "a person falling, collapsing, or showing signs of physical distress. "
    "Respond with exactly ONE of the following tokens and nothing else: "
    "CRITICAL — a severe emergency is visible (person is down and unresponsive, "
    "medical emergency in progress); "
    "WARNING — a concerning event is visible (person stumbled, unusual posture "
    "suggesting distress); "
    "NO_INCIDENT — no safety concern is visible in this footage."
)


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
        self._clip_bytes: dict[VideoClipId, bytes] = {}

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

    def get_clip_bytes(self, clip_id: VideoClipId) -> Optional[bytes]:
        """Return raw video bytes for a previously uploaded clip, or None."""
        return self._clip_bytes.get(clip_id)

    def analyze_uploaded_clip(
        self,
        video_bytes: bytes,
        content_type: str = "video/webm",
        zone_id: ZoneId = "demo-zone",
    ) -> dict[str, str]:
        """Save an uploaded clip, analyze it with Gemini, and invoke onVideoAlert if needed.

        Args:
            video_bytes: Raw video data from the frontend.
            content_type: MIME type of the video (e.g. video/webm, video/mp4).
            zone_id: Gym zone identifier to attach to the clip metadata.

        Returns:
            Dict with keys clip_id, verdict (CRITICAL/WARNING/NO_INCIDENT/UNAVAILABLE), detail.
        """
        clip_id = f"clip-{time.time_ns()}"
        clip = VideoClip(
            clip_id=clip_id,
            created_at=time.time(),
            uri=f"memory://clips/{zone_id}/{clip_id}",
            content_type=content_type,
            metadata={"zone_id": zone_id, "source": "user_upload"},
        )
        self._video_clips_archive.save_clip(clip)
        self._clip_bytes[clip_id] = video_bytes

        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            logging.warning("GEMINI_API_KEY not configured; skipping Gemini analysis.")
            return {"clip_id": clip_id, "verdict": "UNAVAILABLE", "detail": "GEMINI_API_KEY not configured"}

        try:
            from google import genai
            from pydantic import BaseModel, Field
        except ImportError as exc:
            logging.error("google-genai or pydantic not installed: %s", exc)
            return {"clip_id": clip_id, "verdict": "UNAVAILABLE", "detail": "dependencies missing"}

        class VideoAnalysisVerdict(BaseModel):
            verdict: str = Field(description="Exactly one of: CRITICAL, WARNING, NO_INCIDENT")
            detail: str = Field(description="Brief explanation of the incident")

        client = genai.Client(api_key=api_key)

        suffix = ".webm" if "webm" in content_type else ".mp4"
        tmp_path: Optional[str] = None
        video_file = None
        try:
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                tmp.write(video_bytes)
                tmp_path = tmp.name

            video_file = client.files.upload(file=tmp_path, config={'mime_type': content_type})
            while video_file.state == "PROCESSING" and video_file.name is not None:
                time.sleep(0.5)
                video_file = client.files.get(name=video_file.name)

            response = client.models.generate_content(
                model="gemini-3.1-pro-preview",
                contents=[_GEMINI_ANALYSIS_PROMPT, video_file],
                config={"response_mime_type": "application/json", "response_schema": VideoAnalysisVerdict.model_json_schema()}
            )
            
            result_obj = VideoAnalysisVerdict.model_validate_json(response.text or "{}")
            verdict_raw = result_obj.verdict.strip().upper()
            detail = result_obj.detail
        except Exception as exc:
            logging.exception("Gemini analysis failed")
            return {"clip_id": clip_id, "verdict": "UNAVAILABLE", "detail": str(exc)}
        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)
            if video_file is not None and video_file.name is not None:
                try:
                    client.files.delete(name=video_file.name)
                except Exception:
                    pass

        if "CRITICAL" in verdict_raw:
            verdict = "CRITICAL"
            self._analytics_engine.onVideoAlert(AlertSeverity.CRITICAL, clip_id, detail)
        elif "WARNING" in verdict_raw:
            verdict = "WARNING"
            self._analytics_engine.onVideoAlert(AlertSeverity.WARNING, clip_id, detail)
        else:
            verdict = "NO_INCIDENT"

        return {"clip_id": clip_id, "verdict": verdict, "detail": detail}
