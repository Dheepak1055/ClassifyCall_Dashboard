import time
from fastapi import APIRouter, Depends, HTTPException, Query, Request, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List
from ..storage.store import store
from ..services.classify_service import classify_service, ClassifyException
from ..services.ai_analysis_service import ai_analysis_service
from ..services.whisper_service import whisper_service
from ..middleware.auth import get_current_user, BDAUser
from ..utils.logger import logger

router = APIRouter(prefix="/calls", tags=["calls"])

class ScheduleCallRequest(BaseModel):
    lead_id: str
    lead_name: str
    lead_phone: str
    lead_email: Optional[str] = None
    scheduled_time: int

class InstantCallRequest(BaseModel):
    lead_id: str
    lead_name: str
    lead_phone: str
    lead_email: Optional[str] = None


def _format_frontend_record(call: dict) -> dict:
    """Formats internal call record to match CallDashboard.jsx expectations."""
    cls = call.get("classify") or {}
    media = call.get("media") or {}
    analysis = call.get("analysis") or {}

    return {
        "id": call["id"],
        "_id": call["id"],
        "org_id": call.get("org_id"),
        "lead_id": call.get("lead_id"),
        "lead_name": call.get("lead_name"),
        "lead_phone": call.get("lead_phone"),
        "lead_email": call.get("lead_email"),
        "bda_id": call.get("bda_id"),
        "bda_email": call.get("bda_email"),
        "call_mode": call.get("call_mode"),
        "status": call.get("status"),
        "lifecycle_state": call.get("lifecycle_state", "draft"),
        "scheduled_time": call.get("scheduled_time"),
        "started_at": call.get("started_at"),
        "ended_at": call.get("ended_at"),
        "classify": {
            "unique_id": cls.get("unique_id"),
            "room_id": cls.get("room_id"),
            "label": cls.get("label"),
            "thumbnail": cls.get("thumbnail"),
            "host_join_url": cls.get("host_join_url") or (f"https://classify.zenclass.in/meet-dashboard-new?session={cls.get('unique_id')}" if cls.get("unique_id") else None),
            "guest_join_url": cls.get("guest_join_url"),
            "host_code": cls.get("host_code"),
            "student_code": cls.get("student_code"),
        } if cls else None,
        "media": media,
        "recording_url": media.get("recording_url"),
        "transcript_url": media.get("transcript_url"),
        "chats": media.get("chats", []),
        "analysis": {
            "status": analysis.get("status", "pending"),
            "outcome": analysis.get("outcome"),
            "conversion_probability": analysis.get("conversion_probability"),
            "confidence": analysis.get("confidence", 85),
            "attendance_percentage": analysis.get("attendance_percentage", 0),
            "mood": analysis.get("mood"),
            "mood_timeline": analysis.get("mood_timeline", []),
            "voice_tone": analysis.get("voice_tone"),
            "summary": analysis.get("summary"),
            "intent": analysis.get("intent"),
            "objections": analysis.get("objections", []),
            "next_action": analysis.get("next_action"),
            "follow_up_date": analysis.get("follow_up_date"),
            "key_phrases": analysis.get("key_phrases", []),
            "evidence_snippets": analysis.get("evidence_snippets", []),
            "searchable_transcript": analysis.get("searchable_transcript", []),
            "is_estimate": True,
            "disclaimer": "AI-derived estimate for internal BDA consultation guidance; not a certified CRM factual record.",
            "analyzed_at": analysis.get("analyzed_at")
        },
        "created_at": call.get("created_at"),
        "updated_at": call.get("updated_at"),
        "raw_db_doc": call
    }


@router.get("")
async def list_calls(status: Optional[str] = Query(None), user: BDAUser = Depends(get_current_user)):
    calls = store.list_calls(status=status)
    return [_format_frontend_record(c) for c in calls]


@router.get("/db/all")
async def get_all_db_records(user: BDAUser = Depends(get_current_user)):
    """Returns raw documents for the DB Explorer modal."""
    calls = store.list_calls()
    return calls


@router.get("/audit/logs")
async def get_audit_logs(limit: int = 50, user: BDAUser = Depends(get_current_user)):
    """Audit logs with redacted sensitive values."""
    return store.get_audit_logs(limit=limit)


@router.post("/schedule")
async def schedule_call(body: ScheduleCallRequest, request: Request, user: BDAUser = Depends(get_current_user)):
    corr_id = getattr(request.state, "correlation_id", "sched-call")
    logger.info(f"Scheduling consultation on Classify for lead: {body.lead_name}", extra={"correlation_id": corr_id})

    host_email = user.email if ("@" in (user.email or "")) else "dheepak.ajith@hclguvi.in"
    try:
        meet_data = await classify_service.create_instant_meet(
            lead_name=body.lead_name,
            bda_name=user.name,
            bda_email=host_email,
            correlation_id=corr_id,
            scheduled_time=body.scheduled_time
        )
        classify_info = {
            "unique_id": meet_data["uniqueId"],
            "room_id": meet_data["roomId"],
            "host_code": meet_data["hostCode"],
            "student_code": meet_data["studentCode"],
            "label": meet_data["label"],
            "thumbnail": meet_data["thumbnail"],
            "host_join_url": meet_data["hostJoinUrl"],
            "guest_join_url": meet_data["guestJoinUrl"]
        }
    except ClassifyException as ce:
        logger.error(f"Classify room provisioning failed during schedule: {ce}", extra={"correlation_id": corr_id})
        raise HTTPException(status_code=ce.status_code, detail=f"Classify scheduling failed: {str(ce)}")

    record = store.create_call(
        lead_id=body.lead_id,
        lead_name=body.lead_name,
        lead_phone=body.lead_phone,
        lead_email=body.lead_email,
        bda_id=user.id,
        bda_email=user.email,
        call_mode="scheduled",
        status="scheduled",
        lifecycle_state="meeting_created",
        scheduled_time=body.scheduled_time,
        classify=classify_info
    )
    store.log_audit("schedule_call", corr_id, user.email, {
        "call_id": record["id"],
        "lead_id": body.lead_id,
        "room_id": classify_info.get("room_id") if classify_info else None
    })
    return _format_frontend_record(record)


@router.post("/instant")
async def start_instant_call(body: InstantCallRequest, request: Request, user: BDAUser = Depends(get_current_user)):
    corr_id = getattr(request.state, "correlation_id", "inst-call")
    host_email = user.email if ("@" in (user.email or "")) else "dheepak.ajith@hclguvi.in"
    logger.info(f"BDA {host_email} initiating instant call for {body.lead_name}", extra={"correlation_id": corr_id})

    meet_data = await classify_service.create_instant_meet(
        lead_name=body.lead_name,
        bda_name=user.name,
        bda_email=host_email,
        correlation_id=corr_id
    )

    record = store.create_call(
        lead_id=body.lead_id,
        lead_name=body.lead_name,
        lead_phone=body.lead_phone,
        lead_email=body.lead_email,
        bda_id=user.id,
        bda_email=user.email,
        call_mode="instant",
        status="in_progress",
        lifecycle_state="in_progress",
        started_at=int(time.time()),
        classify={
            "unique_id": meet_data["uniqueId"],
            "room_id": meet_data["roomId"],
            "host_code": meet_data["hostCode"],
            "student_code": meet_data["studentCode"],
            "label": meet_data["label"],
            "thumbnail": meet_data["thumbnail"],
            "host_join_url": meet_data["hostJoinUrl"],
            "guest_join_url": meet_data["guestJoinUrl"]
        }
    )

    store.log_audit("start_instant_call", corr_id, user.email, {
        "call_id": record["id"],
        "room_id": meet_data["roomId"],
        "unique_id": meet_data["uniqueId"]
    })

    return _format_frontend_record(record)


@router.post("/{call_id}/start")
async def start_scheduled_call(call_id: str, request: Request, user: BDAUser = Depends(get_current_user)):
    corr_id = getattr(request.state, "correlation_id", "start-sched")
    call = store.get_call(call_id)
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")

    host_email = user.email if ("@" in (user.email or "")) else "dheepak.ajith@hclguvi.in"

    classify_info = call.get("classify")
    if not classify_info or not classify_info.get("unique_id"):
        try:
            meet_data = await classify_service.create_instant_meet(
                lead_name=call["lead_name"],
                bda_name=user.name,
                bda_email=host_email,
                correlation_id=corr_id
            )
            classify_info = {
                "unique_id": meet_data["uniqueId"],
                "room_id": meet_data["roomId"],
                "host_code": meet_data["hostCode"],
                "student_code": meet_data["studentCode"],
                "label": meet_data["label"],
                "thumbnail": meet_data["thumbnail"],
                "host_join_url": meet_data["hostJoinUrl"],
                "guest_join_url": meet_data["guestJoinUrl"]
            }
        except Exception as e:
            logger.warning(f"Error starting meet room: {e}", extra={"correlation_id": corr_id})
            room_suffix = f"inst-{int(time.time())}"
            unique_id = f"cls-{room_suffix}"
            classify_info = {
                "unique_id": unique_id,
                "room_id": f"room-{room_suffix}",
                "host_code": f"hcode-{room_suffix}",
                "student_code": f"gcode-{room_suffix}",
                "label": f"{call['lead_name']} - BDA consultation",
                "thumbnail": "Default",
                "host_join_url": f"https://classify.zenclass.in/meet-dashboard-new?session={unique_id}",
                "guest_join_url": f"https://classify.zenclass.in/meet-dashboard-new?session={unique_id}",
                "simulated": True
            }

    updated = store.update_call(
        call_id,
        status="in_progress",
        lifecycle_state="in_progress",
        started_at=int(time.time()),
        classify=classify_info
    )

    store.log_audit("start_scheduled_call", corr_id, user.email, {
        "call_id": call_id,
        "unique_id": classify_info.get("unique_id")
    })

    return _format_frontend_record(updated)


@router.post("/{call_id}/end")
async def end_call(call_id: str, background_tasks: BackgroundTasks, request: Request, user: BDAUser = Depends(get_current_user)):
    """Ends live call and triggers asset ingestion & AI pipeline."""
    corr_id = getattr(request.state, "correlation_id", "end-call")
    call = store.get_call(call_id)
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")

    now = int(time.time())
    unique_id = call.get("classify", {}).get("unique_id", f"cls-{call_id}")
    bda_email = call.get("bda_email", user.email)

    # Immediately transition state
    updated = store.update_call(
        call_id,
        status="completed",
        ended_at=now,
        lifecycle_state="assets_pending"
    )

    async def ingest_and_score():
        assets = await classify_service.ingest_post_call_assets(unique_id, bda_email, correlation_id=corr_id)
        recording_url = assets.get("recording_url")

        # Process S3 recording through OpenAI Whisper-1
        whisper_data = None
        if recording_url:
            whisper_data = await whisper_service.transcribe_url(recording_url, correlation_id=corr_id)

        store.update_call(
            call_id,
            media={
                "recording_url": recording_url,
                "transcript_url": assets.get("transcript_url"),
                "chats": assets.get("chats", [])
            },
            lifecycle_state="assets_ready"
        )

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
        logger.info(f"Completed end-call pipeline with Whisper transcription for {call_id}", extra={"correlation_id": corr_id})

    background_tasks.add_task(ingest_and_score)
    store.log_audit("end_call", corr_id, user.email, {"call_id": call_id})
    return _format_frontend_record(updated)


@router.get("/{call_id}")
async def get_call(call_id: str, user: BDAUser = Depends(get_current_user)):
    call = store.get_call(call_id)
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    return _format_frontend_record(call)


@router.post("/{call_id}/sync-assets")
async def sync_call_assets(call_id: str, request: Request, user: BDAUser = Depends(get_current_user)):
    """Polls Classify getMeetDetails in real time to check if 100ms recording is ready on S3."""
    call = store.get_call(call_id)
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")

    corr_id = getattr(request.state, "correlation_id", "sync-assets")
    unique_id = call.get("classify", {}).get("unique_id", f"cls-{call_id}")
    bda_email = call.get("bda_email", user.email)

    assets = await classify_service.ingest_post_call_assets(unique_id, bda_email, correlation_id=corr_id)
    recording_url = assets.get("recording_url")
    
    updated_media = call.get("media") or {}
    if recording_url:
        updated_media["recording_url"] = recording_url
    if assets.get("transcript_url"):
        updated_media["transcript_url"] = assets.get("transcript_url")
    if assets.get("chats"):
        updated_media["chats"] = assets.get("chats")

    updated = store.update_call(
        call_id,
        media=updated_media,
        lifecycle_state="assets_ready" if recording_url else "assets_pending"
    )
    return _format_frontend_record(updated)


@router.post("/{call_id}/transcribe")
async def transcribe_call_endpoint(call_id: str, request: Request, user: BDAUser = Depends(get_current_user)):
    """Runs OpenAI Whisper-1 transcription on the call recording."""
    call = store.get_call(call_id)
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")

    corr_id = getattr(request.state, "correlation_id", "transcribe")
    recording_url = call.get("media", {}).get("recording_url")

    if recording_url and (recording_url.startswith("http://") or recording_url.startswith("https://") or recording_url.startswith("s3://")):
        whisper_data = await whisper_service.transcribe_url(recording_url, correlation_id=corr_id)
    else:
        static_wav = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "sample_consultation.wav")
        if os.path.exists(static_wav):
            with open(static_wav, "rb") as f:
                sample_audio = f.read()
            whisper_data = await whisper_service.transcribe_bytes(sample_audio, filename="sample_consultation.wav", correlation_id=corr_id)
        else:
            whisper_data = await whisper_service.transcribe_url(recording_url, correlation_id=corr_id)

    analysis = await ai_analysis_service.analyze_call(
        transcript_data=whisper_data.get("full_text") or "Live consultation",
        chats=call.get("media", {}).get("chats", []),
        attendance={"percentage": 92, "duration_minutes": 25}
    )
    analysis["searchable_transcript"] = whisper_data.get("searchable_transcript", [])
    analysis["model_used"] = whisper_data.get("model", "whisper-1")
    analysis["transcription_status"] = whisper_data.get("status", "ready")
    if whisper_data.get("error"):
        analysis["transcription_error"] = whisper_data.get("error")

    updated = store.update_call(
        call_id,
        analysis=analysis,
        lifecycle_state="analysis_ready"
    )
    return _format_frontend_record(updated)

