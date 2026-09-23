from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field, EmailStr


CallMode = Literal["instant", "scheduled"]
CallStatus = Literal["scheduled", "in_progress", "completed", "failed", "no_show", "cancelled"]
AnalysisStatus = Literal["pending", "done", "failed", "skipped_no_transcript"]
Outcome = Literal["interested", "not_interested", "follow_up", "no_show", "unclear"]
Mood = Literal["positive", "neutral", "negative", "mixed"]


class ScheduleCallRequest(BaseModel):
    lead_id: str
    lead_name: str
    lead_phone: str
    lead_email: Optional[EmailStr] = None
    scheduled_time: int = Field(..., description="Unix epoch seconds, must be in the future")


class InstantCallRequest(BaseModel):
    lead_id: str
    lead_name: str
    lead_phone: str
    lead_email: Optional[EmailStr] = None


class ClassifyMeetInfo(BaseModel):
    unique_id: str
    room_id: str
    label: str
    thumbnail: str
    host_join_url: str
    guest_join_url: str


class CallAnalysis(BaseModel):
    status: AnalysisStatus = "pending"
    outcome: Optional[Outcome] = None
    conversion_probability: Optional[int] = Field(None, ge=0, le=100)
    mood: Optional[Mood] = None
    mood_timeline: list[dict] = Field(default_factory=list)
    voice_tone: Optional[str] = None  # null unless a real tone source exists — see README §6.3
    summary: Optional[str] = None
    key_phrases: list[str] = Field(default_factory=list)
    analyzed_at: Optional[int] = None


class CallRecord(BaseModel):
    id: str
    org_id: str
    lead_id: str
    lead_name: str
    lead_phone: str
    lead_email: Optional[str] = None
    bda_id: str
    bda_email: str

    call_mode: CallMode
    status: CallStatus
    scheduled_time: Optional[int] = None
    started_at: Optional[int] = None
    ended_at: Optional[int] = None

    classify: Optional[ClassifyMeetInfo] = None
    recording_url: Optional[str] = None
    transcript_url: Optional[str] = None
    chats: list[dict] = Field(default_factory=list)

    analysis: CallAnalysis = Field(default_factory=CallAnalysis)

    created_at: int
    updated_at: int


class CallListFilters(BaseModel):
    status: Optional[CallStatus] = None
    call_mode: Optional[CallMode] = None
    bda_id: Optional[str] = None  # ignored unless caller holds video_calls_all_leads
    date_from: Optional[int] = None
    date_to: Optional[int] = None
    page: int = 1
    page_size: int = Field(25, le=100)
