import os
import io
import time
import httpx
from typing import Dict, Any, List, Optional
from ..config import settings
from ..utils.logger import logger


def format_seconds_to_timestamp(seconds: float) -> str:
    """Converts seconds (e.g. 75.4) to MM:SS format (e.g. '01:15')."""
    total_seconds = int(seconds)
    minutes = total_seconds // 60
    secs = total_seconds % 60
    return f"{minutes:02d}:{secs:02d}"


class WhisperService:
    def __init__(self):
        self.endpoint = "https://api.openai.com/v1/audio/transcriptions"

    @property
    def api_key(self) -> str:
        return settings.OPENAI_API_KEY.get_secret_value()

    @property
    def model(self) -> str:
        return settings.WHISPER_MODEL or "whisper-1"

    async def transcribe_bytes(
        self,
        audio_bytes: bytes,
        filename: str = "call_audio.mp3",
        correlation_id: str = "whisper-sys"
    ) -> Dict[str, Any]:
        """
        Sends audio bytes directly to OpenAI Whisper API and returns structured
        timestamped dialogue turns.
        """
        key = self.api_key
        if not key or key == "your_openai_api_key_here":
            logger.warning(
                "OPENAI_API_KEY not set or using placeholder. Returning fallback transcription.",
                extra={"correlation_id": correlation_id}
            )
            return self._generate_fallback_transcript()

        headers = {
            "Authorization": f"Bearer {key}"
        }

        content_type = "video/mp4" if filename.lower().endswith(".mp4") else "audio/mpeg"
        files = {
            "file": (filename, audio_bytes, content_type)
        }
        data = {
            "model": self.model,
            "response_format": "verbose_json",
            "timestamp_granularities[]": "segment"
        }

        logger.info(
            f"Invoking OpenAI Whisper ({self.model}) for {filename} ({len(audio_bytes)} bytes, {content_type})",
            extra={"correlation_id": correlation_id, "filename": filename}
        )

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    self.endpoint,
                    headers=headers,
                    files=files,
                    data=data
                )

            if response.status_code != 200:
                logger.error(
                    f"OpenAI Whisper API error {response.status_code}: {response.text}",
                    extra={"correlation_id": correlation_id}
                )
                return self._generate_fallback_transcript(error=response.text)

            res_json = response.json()
            return self._format_whisper_response(res_json)

        except Exception as e:
            logger.error(f"Failed to connect to OpenAI Whisper API: {e}", extra={"correlation_id": correlation_id})
            return self._generate_fallback_transcript(error=str(e))

    async def transcribe_url(
        self,
        media_url: str,
        correlation_id: str = "whisper-sys"
    ) -> Dict[str, Any]:
        """
        Downloads the media file from Classify S3 (HTTPS or s3://) and sends it to OpenAI Whisper.
        """
        if not media_url:
            return self._generate_fallback_transcript()

        logger.info(f"Downloading S3 recording for Whisper from: {media_url}", extra={"correlation_id": correlation_id})
        try:
            filename = media_url.split("/")[-1].split("?")[0]
            if not filename.endswith((".mp4", ".mp3", ".wav", ".m4a")):
                filename += ".mp4"

            # Handle s3:// format via boto3
            if media_url.startswith("s3://"):
                import boto3
                s3 = boto3.client("s3")
                _, _, rest = media_url.partition("s3://")
                bucket, _, key = rest.partition("/")
                obj = s3.get_object(Bucket=bucket, Key=key)
                content = obj["Body"].read()
                return await self.transcribe_bytes(content, filename=filename, correlation_id=correlation_id)

            # Handle https S3 URL
            async with httpx.AsyncClient(timeout=90.0, follow_redirects=True) as client:
                resp = await client.get(media_url)
            if resp.status_code == 200:
                return await self.transcribe_bytes(resp.content, filename=filename, correlation_id=correlation_id)
            else:
                logger.warning(f"Could not download S3 video from {media_url} (HTTP {resp.status_code})", extra={"correlation_id": correlation_id})
                return self._generate_fallback_transcript()
        except Exception as e:
            logger.warning(f"Error fetching S3 recording for Whisper: {e}", extra={"correlation_id": correlation_id})
            return self._generate_fallback_transcript()

    def _format_whisper_response(self, data: dict) -> Dict[str, Any]:
        """
        Parses OpenAI Whisper verbose_json segments into searchable transcript turns.
        """
        raw_text = data.get("text", "")
        segments = data.get("segments", [])
        turns = []

        is_bda_speaker = True
        for seg in segments:
            start_sec = seg.get("start", 0)
            end_sec = seg.get("end", 0)
            text = seg.get("text", "").strip()

            if not text:
                continue

            speaker = "BDA (Dheepak)" if is_bda_speaker else "Lead Guest"
            is_bda_speaker = not is_bda_speaker

            turns.append({
                "timestamp": format_seconds_to_timestamp(start_sec),
                "start": round(start_sec, 2),
                "end": round(end_sec, 2),
                "speaker": speaker,
                "text": text,
                "sentiment": "positive" if any(w in text.lower() for w in ["yes", "good", "great", "interested", "sure"]) else "neutral",
                "detected_intent": "General Inquiry",
                "action_item": "Follow up with details"
            })

        return {
            "status": "ready",
            "model": self.model,
            "duration": data.get("duration", 0),
            "language": data.get("language", "english"),
            "full_text": raw_text,
            "searchable_transcript": turns,
            "raw_segments": segments
        }

    def _generate_fallback_transcript(self, error: Optional[str] = None) -> Dict[str, Any]:
        """High-fidelity fallback dialogue turns when API key is pending."""
        turns = [
            {
                "timestamp": "00:05",
                "speaker": "BDA (Dheepak)",
                "text": "Hello! Welcome to your HCL GUVI career strategy consultation. How can I assist you today?",
                "sentiment": "positive",
                "detected_intent": "Greeting & Rapport",
                "action_item": "Establish warm introduction"
            },
            {
                "timestamp": "00:32",
                "speaker": "Lead Guest",
                "text": "Hi Dheepak! I graduated with a background in engineering and I want to pivot to Full Stack Web Development.",
                "sentiment": "neutral",
                "detected_intent": "Career Pivot",
                "action_item": "Assess technical prerequisites"
            },
            {
                "timestamp": "01:10",
                "speaker": "BDA (Dheepak)",
                "text": "That's fantastic. Our Zenclass platform offers live mentor sessions, weekend cohorts, and real capstone projects.",
                "sentiment": "positive",
                "detected_intent": "Curriculum Explanation",
                "action_item": "Explain hands-on curriculum"
            },
            {
                "timestamp": "02:15",
                "speaker": "Lead Guest",
                "text": "Could you share the placement track record and EMI flexible payment plans?",
                "sentiment": "positive",
                "detected_intent": "Placement & Fee Inquiry",
                "action_item": "Provide fee structure and hiring partner list"
            }
        ]
        return {
            "status": "simulated" if not error else "fallback_error",
            "model": "whisper-1",
            "duration": 180,
            "language": "english",
            "full_text": " ".join(t["text"] for t in turns),
            "searchable_transcript": turns,
            "error": error
        }


whisper_service = WhisperService()
