"""
Runs once a call's Classify room reports transcriptStored=success. Pulls
the transcript (and chat log, if separate) from S3, asks the existing
Bedrock/Qwen 3 provider for a structured read, and writes the result onto
the lead_calls row.

# TODO: confirm two things against the real codebase before relying on this:
#   1. app.providers.llm.bedrock — the existing NL-filter provider already
#      talks to Bedrock/Qwen; reuse its client/auth rather than opening a
#      second connection. The function signature below is a guess at its
#      shape (system + user message in, parsed JSON out) — adjust to match.
#   2. Where recordingUrl/transcriptUrl actually point. The brief's sample
#      response doesn't include them on the create call (they show up later,
#      once roomStatusData flips) — this assumes GET /getMeet or similar
#      exists to fetch the updated document; swap fetch_meet_details() for
#      whatever the real "read back a meet" call is.
"""

from __future__ import annotations

import json
import time

import boto3

from app.config import settings
from app.providers.llm.bedrock import chat_completion  # TODO: confirm this exists with this shape
from app.mongodb.collections.calls import calls_collection

s3 = boto3.client("s3")

ANALYSIS_SYSTEM_PROMPT = """You are scoring a BDA-to-lead sales call transcript for a CRM tool.
Read the transcript and return ONLY a JSON object, no prose, no markdown fences, matching:
{
  "outcome": "interested" | "not_interested" | "follow_up" | "no_show" | "unclear",
  "conversion_probability": <integer 0-100>,
  "mood": "positive" | "neutral" | "negative" | "mixed",
  "mood_timeline": [{"segment": "<mm:ss-mm:ss>", "mood": "positive|neutral|negative"}],
  "summary": "<2-3 sentence summary of the call>",
  "key_phrases": ["<short phrase>", ...]
}
Base every field only on what's actually said in the transcript. If the transcript is too short
or unclear to judge, use "unclear" / null-ish low-confidence values rather than guessing.
Do not invent a voice tone or emotion that isn't evidenced in the words themselves — a text
transcript alone cannot tell you pitch, pace, or hesitation, so leave that to a separate signal.
"""


async def process_completed_call(record) -> None:
    meet_details = await fetch_meet_details(record.classify.unique_id)

    if meet_details.get("roomStatusData", {}).get("transcriptStored") != "success":
        await calls_collection.update(
            record.id,
            status="completed",
            ended_at=int(time.time()),
            analysis={"status": "skipped_no_transcript"},
        )
        return

    transcript_text = fetch_transcript_text(meet_details["transcripts"])
    chats = meet_details.get("chats", [])
    recording_url = first_or_none(meet_details.get("recordings", []))

    if not transcript_text.strip():
        await calls_collection.update(
            record.id,
            status="completed",
            ended_at=int(time.time()),
            recording_url=recording_url,
            chats=chats,
            analysis={"status": "skipped_no_transcript"},
        )
        return

    analysis = await score_transcript(transcript_text)

    await calls_collection.update(
        record.id,
        status="completed",
        ended_at=int(time.time()),
        recording_url=recording_url,
        transcript_url=first_or_none(meet_details["transcripts"]),
        chats=chats,
        analysis={**analysis, "status": "done", "analyzed_at": int(time.time())},
    )


async def score_transcript(transcript_text: str) -> dict:
    # Keep prompts bounded; a full call transcript can be long.
    trimmed = transcript_text[:20000]

    raw = await chat_completion(
        system=ANALYSIS_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": trimmed}],
        response_format="json",
    )

    try:
        parsed = json.loads(raw.strip().removeprefix("```json").removesuffix("```").strip())
    except (json.JSONDecodeError, AttributeError):
        return {
            "outcome": "unclear",
            "conversion_probability": None,
            "mood": None,
            "mood_timeline": [],
            "voice_tone": None,
            "summary": "Automated analysis failed to parse — needs a manual listen.",
            "key_phrases": [],
        }

    parsed.setdefault("voice_tone", None)  # never fabricated from text alone — README §6.3
    return parsed


def fetch_transcript_text(transcript_urls: list[str]) -> str:
    if not transcript_urls:
        return ""
    bucket, key = _parse_s3_url(transcript_urls[0])
    obj = s3.get_object(Bucket=bucket, Key=key)
    return obj["Body"].read().decode("utf-8", errors="replace")


def _parse_s3_url(url: str) -> tuple[str, str]:
    # Accepts either s3://bucket/key or an https classifyprod.s3.*.amazonaws.com/key URL.
    if url.startswith("s3://"):
        _, _, rest = url.partition("s3://")
        bucket, _, key = rest.partition("/")
        return bucket, key
    # https://<bucket>.s3.<region>.amazonaws.com/<key>
    host, _, key = url.replace("https://", "").partition("/")
    bucket = host.split(".s3.")[0]
    return bucket, key


def first_or_none(items: list) -> str | None:
    return items[0] if items else None


async def fetch_meet_details(unique_id: str) -> dict:
    """
    ASSUMPTION: only createInstantMeet is documented in the brief, not a
    "read a meet back" endpoint — but roomStatusData/recordings/transcripts
    clearly get filled in after creation, so something like GET /meet/{id}
    almost certainly exists on Classify's side. Wire this to the real
    endpoint once confirmed; everything above only depends on this dict's
    shape (transcripts / chats / recordings / roomStatusData), matching the
    sample response in the brief.
    """
    raise NotImplementedError(
        "Point this at Classify's read-meet endpoint once confirmed (see README §6.4)."
    )
