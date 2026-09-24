import time
from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from ..storage.store import store
from ..services.classify_service import classify_service
from ..services.ai_analysis_service import ai_analysis_service
from ..services.whisper_service import whisper_service
from ..utils.logger import logger

router = APIRouter(tags=["webhook"])

async def background_asset_pipeline(call_id: str, unique_id: str, bda_email: str):
    """Asynchronous background worker that polls assets and runs AI analysis."""
    logger.info(f"Starting background asset ingestion for call {call_id} (uniqueId: {unique_id})")
    
    # 1. Ingest assets from Classify S3
    assets = await classify_service.ingest_post_call_assets(unique_id, bda_email)
    recording_url = assets.get("recording_url")

    # 2. Transcribe S3 MP4 recording via OpenAI Whisper-1
    whisper_data = None
    if recording_url:
        whisper_data = await whisper_service.transcribe_url(recording_url, correlation_id=f"wh-{call_id}")

    store.update_call(
        call_id,
        media={
            "recording_url": recording_url,
            "transcript_url": assets.get("transcript_url"),
            "chats": assets.get("chats", [])
        },
        lifecycle_state="assets_ready"
    )

    # 3. Run AI post-processing
    transcript_text = (whisper_data.get("full_text") if whisper_data and whisper_data.get("full_text") else assets.get("transcript_url"))
    analysis = await ai_analysis_service.analyze_call(
        transcript_data=transcript_text,
        chats=assets.get("chats"),
        attendance=assets.get("attendance")
    )

    if whisper_data and whisper_data.get("searchable_transcript"):
        analysis["searchable_transcript"] = whisper_data["searchable_transcript"]

    store.update_call(
        call_id,
        status="completed",
        lifecycle_state="analysis_ready",
        analysis=analysis
    )
    logger.info(f"Asset ingestion and Whisper AI analysis complete for call {call_id}")


@router.post("/classify")
async def handle_classify_webhook(payload: dict, background_tasks: BackgroundTasks, request: Request):
    """
    Receives Classify session-end or recording-ready webhook event.
    """
    corr_id = getattr(request.state, "correlation_id", "wh-cls")
    logger.info("Received Classify webhook callback", extra={"correlation_id": corr_id, "body": payload})

    room_id = payload.get("roomId") or payload.get("room_id")
    unique_id = payload.get("uniqueId") or payload.get("unique_id")

    call = None
    if room_id:
        call = store.get_by_room_id(room_id)
    if not call and unique_id:
        call = store.get_by_unique_id(unique_id)

    if not call:
        logger.warning(f"No matching call found for webhook event room_id={room_id}, unique_id={unique_id}", extra={"correlation_id": corr_id})
        return {"status": "ignored", "reason": "call not found"}

    call_id = call["id"]
    u_id = unique_id or call.get("classify", {}).get("unique_id", "")
    bda_email = call.get("bda_email", "dheepak.ajith@hclguvi.in")

    # Mark meeting ended and queue asset ingestion
    store.update_call(
        call_id,
        status="completed",
        ended_at=int(time.time()),
        lifecycle_state="assets_pending"
    )

    background_tasks.add_task(background_asset_pipeline, call_id, u_id, bda_email)

    return {"status": "accepted", "call_id": call_id, "lifecycle_state": "assets_pending"}
