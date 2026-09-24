from fastapi import APIRouter, Depends, HTTPException, Query, Request
from typing import Optional
from ..services.lead_call_service import lead_call_service, LeadCallAPIException
from ..middleware.auth import get_current_user, BDAUser

router = APIRouter(tags=["leads"])

@router.get("/search")
async def search_leads(q: str = Query(..., min_length=1), request: Request = None, user: BDAUser = Depends(get_current_user)):
    corr_id = getattr(request.state, "correlation_id", "sys") if request else "sys"
    try:
        results = await lead_call_service.search_leads(q, correlation_id=corr_id)
        return {"leads": results}
    except LeadCallAPIException as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))


@router.get("/{lead_id}/calls")
async def get_lead_calls(lead_id: str, limit: int = 20, request: Request = None, user: BDAUser = Depends(get_current_user)):
    corr_id = getattr(request.state, "correlation_id", "sys") if request else "sys"
    try:
        calls = await lead_call_service.get_lead_calls(lead_id, limit=limit, correlation_id=corr_id)
        return {"calls": calls}
    except LeadCallAPIException as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))


@router.get("/calls/{call_id}/transcript")
async def get_call_transcript(call_id: str, request: Request = None, user: BDAUser = Depends(get_current_user)):
    corr_id = getattr(request.state, "correlation_id", "sys") if request else "sys"
    try:
        return await lead_call_service.get_transcript(call_id, correlation_id=corr_id)
    except LeadCallAPIException as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))


@router.get("/calls/{call_id}/recording")
async def get_call_recording(call_id: str, request: Request = None, user: BDAUser = Depends(get_current_user)):
    corr_id = getattr(request.state, "correlation_id", "sys") if request else "sys"
    try:
        return await lead_call_service.get_recording(call_id, correlation_id=corr_id)
    except LeadCallAPIException as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))
