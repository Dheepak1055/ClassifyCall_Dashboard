import time
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Optional, List
from ..storage.store import store
from ..services.classify_service import classify_service, ClassifyException
from ..middleware.auth import get_current_user, BDAUser
from ..utils.logger import logger

router = APIRouter(tags=["meetings"])

class CreateInstantMeetRequest(BaseModel):
    lead_id: str
    lead_name: str
    lead_phone: str
    lead_email: Optional[str] = None

class InviteGuestRequest(BaseModel):
    guest_email: str
    guest_name: str

@router.post("/create")
async def create_meeting(body: CreateInstantMeetRequest, request: Request, user: BDAUser = Depends(get_current_user)):
    """Creates a Classify instant meeting with BDA internal GUVI admin email as single host."""
    corr_id = getattr(request.state, "correlation_id", "sys-meet")
    logger.info(f"Creating instant meeting for lead {body.lead_name}", extra={"correlation_id": corr_id})

    try:
        host_email = user.email if ("@" in (user.email or "")) else "dheepak.ajith@hclguvi.in"
        meet_data = await classify_service.create_instant_meet(
            lead_name=body.lead_name,
            bda_name=user.name,
            bda_email=host_email,
            correlation_id=corr_id
        )

        call_record = store.create_call(
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

        store.log_audit("create_meeting", corr_id, user.email, {"call_id": call_record["id"], "unique_id": meet_data["uniqueId"]})
        return call_record

    except ClassifyException as ce:
        logger.error(f"Classify meet creation failed: {ce}", extra={"correlation_id": corr_id})
        raise HTTPException(status_code=ce.status_code, detail=str(ce))


@router.get("/{call_id}")
async def get_meeting_status(call_id: str, user: BDAUser = Depends(get_current_user)):
    call = store.get_call(call_id)
    if not call:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return call


@router.post("/{call_id}/invite-guest")
async def invite_guest(call_id: str, body: InviteGuestRequest, request: Request, user: BDAUser = Depends(get_current_user)):
    """Classify guest participant flow: uses student code without adding guest to host accounts."""
    call = store.get_call(call_id)
    if not call:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    classify_info = call.get("classify") or {}
    guest_url = classify_info.get("guest_join_url")

    updated = store.update_call(call_id, lifecycle_state="guest_invited")
    store.log_audit("invite_guest", getattr(request.state, "correlation_id", "sys"), user.email, {
        "call_id": call_id,
        "guest_email": body.guest_email
    })

    return {
        "message": "Guest invite generated successfully",
        "guest_join_url": guest_url,
        "student_code": classify_info.get("student_code"),
        "lifecycle_state": "guest_invited"
    }
