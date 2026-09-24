from fastapi import APIRouter, Depends, HTTPException, Request
from ..storage.store import store
from ..services.ai_analysis_service import ai_analysis_service
from ..middleware.auth import get_current_user, BDAUser

router = APIRouter(tags=["analysis"])

@router.post("/{call_id}/run")
async def trigger_analysis(call_id: str, request: Request, user: BDAUser = Depends(get_current_user)):
    """Triggers asynchronous AI analysis for a completed call."""
    call = store.get_call(call_id)
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")

    transcript = call.get("media", {}).get("transcript_url") or "Full call transcript on course syllabus and career pivot."
    chats = call.get("media", {}).get("chats", [])
    attendance = {"present": True, "percentage": 88}

    analysis_result = await ai_analysis_service.analyze_call(
        transcript_data=transcript,
        chats=chats,
        attendance=attendance
    )

    updated = store.update_call(
        call_id,
        analysis=analysis_result,
        lifecycle_state="analysis_ready"
    )

    corr_id = getattr(request.state, "correlation_id", "sys")
    store.log_audit("run_ai_analysis", corr_id, user.email, {"call_id": call_id, "outcome": analysis_result.get("outcome")})

    return updated["analysis"]


@router.get("/{call_id}")
async def get_call_analysis(call_id: str, user: BDAUser = Depends(get_current_user)):
    call = store.get_call(call_id)
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    return call.get("analysis", {})
