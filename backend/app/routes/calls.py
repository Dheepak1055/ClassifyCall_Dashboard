"""
Routes for the video-call feature. Gated by the `video_calls` feature
(+ `video_calls_all_leads` modifier), same pattern as tracker/positive/etc.

# TODO: swap these three imports for the real helpers once wired into DORA:
#   - require_feature(...)      -> app.services.permissions
#   - get_current_user          -> app.middleware.auth
#   - log_activity(...)         -> app.services.activity
#   - notify(...)                -> app.services.notify
# Names below are written to match the shape described in the README the
# rest of the codebase already follows (feature gate on the route, not the
# role; activity log call alongside every mutating action).
"""

from __future__ import annotations

import time

from fastapi import APIRouter, Depends, HTTPException

from app.middleware.auth import get_current_user  # TODO: confirm import path
from app.services.permissions import require_feature  # TODO: confirm import path
from app.services.activity import log_activity  # TODO: confirm import path
from app.services.notify import send_sms, send_email  # TODO: confirm real signature
from app.providers.videocall.classify_client import (
    ClassifyError,
    ClassifyHost,
    build_join_url,
    create_instant_meet,
)
from app.mongodb.collections.calls import calls_collection
from app.schemas.calls import (
    CallListFilters,
    CallRecord,
    InstantCallRequest,
    ScheduleCallRequest,
)

router = APIRouter(prefix="/calls", tags=["calls"])


@router.post("/schedule", response_model=CallRecord)
async def schedule_call(
    body: ScheduleCallRequest,
    user=Depends(get_current_user),
    _=Depends(require_feature("video_calls")),
):
    """DORA-side intent only — no Classify call yet. See README §2."""
    if body.scheduled_time <= int(time.time()):
        raise HTTPException(400, "scheduled_time must be in the future")

    record = await calls_collection.create(
        org_id=user.org_id,
        lead_id=body.lead_id,
        lead_name=body.lead_name,
        lead_phone=body.lead_phone,
        lead_email=body.lead_email,
        bda_id=user.id,
        bda_email=user.email,
        call_mode="scheduled",
        status="scheduled",
        scheduled_time=body.scheduled_time,
    )
    await log_activity(user, action="call_scheduled", target_id=record.id)
    return record


@router.post("/instant", response_model=CallRecord)
async def start_instant_call(
    body: InstantCallRequest,
    user=Depends(get_current_user),
    _=Depends(require_feature("video_calls")),
):
    record = await calls_collection.create(
        org_id=user.org_id,
        lead_id=body.lead_id,
        lead_name=body.lead_name,
        lead_phone=body.lead_phone,
        lead_email=body.lead_email,
        bda_id=user.id,
        bda_email=user.email,
        call_mode="instant",
        status="scheduled",  # briefly, until the Classify call below resolves
    )
    return await _spin_up_room(record.id, user)


@router.post("/{call_id}/start", response_model=CallRecord)
async def start_scheduled_call(
    call_id: str,
    user=Depends(get_current_user),
    _=Depends(require_feature("video_calls")),
):
    """BDA clicks Start on a call they earlier scheduled (README §2, step 2)."""
    record = await calls_collection.get(call_id, org_id=user.org_id)
    if not record:
        raise HTTPException(404, "Call not found")
    if record.status != "scheduled":
        raise HTTPException(409, f"Call is already {record.status}")
    return await _spin_up_room(call_id, user)


async def _spin_up_room(call_id: str, user) -> CallRecord:
    record = await calls_collection.get(call_id, org_id=user.org_id)
    host = ClassifyHost(name=user.name, email=user.email)  # falls back to CLASSIFY_HOST_EMAIL if the BDA has no Classify seat — see README §6.1

    try:
        meet = await create_instant_meet(
            label=f"Call with {record.lead_name} — {user.name}"[:120],
            hosts=[host],
            org_id=record.org_id,
        )
    except ClassifyError as e:
        await calls_collection.update(call_id, status="failed")
        raise HTTPException(502, f"Could not start the call room: {e}") from e

    host_url = f"https://classify.zenclass.in/meet-dashboard-new?session={meet.unique_id}"
    guest_url = build_join_url(meet.room_id, meet.student_code, "student")

    updated = await calls_collection.update(
        call_id,
        status="in_progress",
        started_at=int(time.time()),
        classify={
            "unique_id": meet.unique_id,
            "room_id": meet.room_id,
            "label": meet.label,
            "thumbnail": meet.thumbnail,
            "host_join_url": host_url,
            "guest_join_url": guest_url,
        },
    )

    await log_activity(user, action="call_started", target_id=call_id)

    # Guest entry: the lead never touches Classify's own login, just this link.
    if updated.lead_phone:
        await send_sms(updated.lead_phone, f"Hi {updated.lead_name}, join your call: {guest_url}")
    if updated.lead_email:
        await send_email(updated.lead_email, subject="Your scheduled call", body=f"Join here: {guest_url}")

    return updated


@router.get("", response_model=list[CallRecord])
async def list_calls(
    filters: CallListFilters = Depends(),
    user=Depends(get_current_user),
    _=Depends(require_feature("video_calls")),
):
    scope_all = user.has_feature("video_calls_all_leads")  # TODO: confirm the real modifier-check helper
    return await calls_collection.list(
        org_id=user.org_id,
        bda_id=None if scope_all else user.id,
        **filters.model_dump(exclude_none=True, exclude={"page", "page_size"}),
        page=filters.page,
        page_size=filters.page_size,
    )


@router.get("/{call_id}", response_model=CallRecord)
async def get_call(
    call_id: str,
    user=Depends(get_current_user),
    _=Depends(require_feature("video_calls")),
):
    record = await calls_collection.get(call_id, org_id=user.org_id)
    if not record:
        raise HTTPException(404, "Call not found")
    return record


@router.post("/webhook/classify")
async def classify_webhook(payload: dict):
    """
    Placeholder landing spot for a Classify session-end callback, IF one
    exists (README §6.4) — not confirmed. A poll job (not included here,
    but trivial: fetch each in_progress call's roomStatusData on an
    interval) can call the same body of logic directly instead of going
    through HTTP.
    """
    room_id = payload.get("roomId")
    if not room_id:
        raise HTTPException(400, "roomId missing")

    record = await calls_collection.get_by_room_id(room_id)
    if not record:
        raise HTTPException(404, "No matching call")

    from app.services.call_analysis import process_completed_call  # local import to avoid a cycle

    await process_completed_call(record)
    return {"ok": True}
