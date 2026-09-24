import time
import uuid
from typing import Dict, List, Optional, Any
from copy import deepcopy

# Initial seed data reflecting both historical calls and realistic states
INITIAL_CALLS = [
    {
        "id": "call-101",
        "org_id": "dheepak.ajith@hclguvi.in",
        "lead_id": "lead-8821",
        "lead_name": "Aarav Sharma",
        "lead_phone": "+91 98765 43210",
        "lead_email": "aarav.sharma@example.com",
        "bda_id": "bda-admin-101",
        "bda_email": "dheepak.ajith@hclguvi.in",
        "call_mode": "scheduled",
        "status": "scheduled",
        "lifecycle_state": "meeting_created",
        "scheduled_time": int(time.time()) + 7200,
        "started_at": None,
        "ended_at": None,
        "classify": {
            "unique_id": "08320032-aa91-4657-9230-d535e3ac92a9",
            "room_id": "6ab4c555c42bb32b75d3107b",
            "label": "Aarav Sharma - BDA consultation",
            "thumbnail": "Default",
            "host_join_url": "https://classify.zenclass.in/meet-dashboard-new?session=08320032-aa91-4657-9230-d535e3ac92a9",
            "guest_join_url": "https://classify.zenclass.in/meet/6ab4c555c42bb32b75d3107b?code=dgm-ebls-cur&role=student",
            "host_code": "nva-nnyi-rhi",
            "student_code": "dgm-ebls-cur"
        },
        "media": {
            "recording_url": None,
            "transcript_url": None,
            "chats": []
        },
        "analysis": {
            "status": "pending",
            "outcome": None,
            "conversion_probability": None,
            "attendance_percentage": 0,
            "mood": None,
            "mood_timeline": [],
            "voice_tone": None,
            "summary": None,
            "key_phrases": [],
            "is_estimate": True
        },
        "created_at": int(time.time()) - 3600,
        "updated_at": int(time.time()) - 3600
    },
    {
        "id": "call-104",
        "org_id": "dheepak.ajith@hclguvi.in",
        "lead_id": "crm-lead-97654",
        "lead_name": "Priya Nair",
        "lead_phone": "+91 97654 32109",
        "lead_email": "priya.nair@example.com",
        "bda_id": "bda-admin-101",
        "bda_email": "dheepak.ajith@hclguvi.in",
        "call_mode": "instant",
        "status": "completed",
        "lifecycle_state": "analysis_ready",
        "scheduled_time": int(time.time()) - 86400,
        "started_at": int(time.time()) - 86400,
        "ended_at": int(time.time()) - 84600,
        "classify": {
            "unique_id": "cls-uuid-904128",
            "room_id": "room-p904",
            "label": "Priya Nair - BDA consultation",
            "thumbnail": "https://classifyprod.s3.amazonaws.com/thumbnails/room-p904.jpg",
            "host_join_url": "https://classify.zenclass.in/meet-dashboard-new?session=cls-uuid-904128",
            "guest_join_url": "https://classify.zenclass.in/meet/room-p904?code=guest-code-104&role=student",
            "host_code": "host-code-104",
            "student_code": "guest-code-104"
        },
        "media": {
            "recording_url": "http://localhost:4000/static/sample_consultation.wav",
            "transcript_url": None,
            "chats": [
                {"from": "BDA (Dheepak)", "text": "Hi Priya, welcome to today's Classify video consultation!", "ts": 10},
                {"from": "Priya Nair", "text": "Hi Dheepak, excited to explore the Full Stack Web Development program.", "ts": 25},
                {"from": "BDA (Dheepak)", "text": "Great! Let me present our syllabus, mentorship, and placement guarantee.", "ts": 45},
                {"from": "Priya Nair", "text": "Can you share the EMI installment schedule and the upcoming cohort start date?", "ts": 90}
            ]
        },
        "analysis": {
            "status": "done",
            "outcome": "interested",
            "conversion_probability": 88,
            "confidence": 92,
            "attendance_percentage": 85,
            "mood": "positive",
            "mood_timeline": [
                {"segment": "0:00-1:30", "mood": "neutral"},
                {"segment": "1:30-4:00", "mood": "positive"},
                {"segment": "4:00-6:30", "mood": "positive"}
            ],
            "voice_tone": "Engaged and curious; asking decisive questions regarding enrollment and curriculum timeline",
            "summary": "Lead demonstrated high purchase intent for Full Stack Web Development. Inquired in detail about no-cost EMI options, cohort timings, and live placement support.",
            "intent": "Career transition to Tech / Full Stack Engineering",
            "objections": ["Worried about managing live classes alongside current full-time employment schedule"],
            "next_action": "Share syllabus PDF and EMI payment link via WhatsApp; follow up on Friday",
            "follow_up_date": "2026-09-26",
            "key_phrases": [
                "Full Stack Web Dev",
                "EMI installment options",
                "Career placement support",
                "Weekend batch flexibility"
            ],
            "is_estimate": True,
            "evidence_snippets": [
                {"timestamp": "01:25", "speaker": "Priya Nair", "text": "I really want to switch to tech and your placement record looks solid."},
                {"timestamp": "04:10", "speaker": "Priya Nair", "text": "Could you send me the EMI breakdown? If it's under 5k a month, I'm ready to enroll."}
            ],
            "analyzed_at": int(time.time()) - 84000
        },
        "created_at": int(time.time()) - 86400,
        "updated_at": int(time.time()) - 84000
    }
]


class Store:
    def __init__(self):
        self._calls: Dict[str, dict] = {c["id"]: deepcopy(c) for c in INITIAL_CALLS}
        self._audit_logs: List[dict] = []

    def get_call(self, call_id: str) -> Optional[dict]:
        call = self._calls.get(call_id)
        return deepcopy(call) if call else None

    def get_by_room_id(self, room_id: str) -> Optional[dict]:
        for call in self._calls.values():
            if call.get("classify", {}).get("room_id") == room_id:
                return deepcopy(call)
        return None

    def get_by_unique_id(self, unique_id: str) -> Optional[dict]:
        for call in self._calls.values():
            if call.get("classify", {}).get("unique_id") == unique_id:
                return deepcopy(call)
        return None

    def list_calls(self, status: Optional[str] = None, bda_id: Optional[str] = None) -> List[dict]:
        results = []
        for call in self._calls.values():
            if status and call.get("status") != status:
                continue
            if bda_id and call.get("bda_id") != bda_id:
                continue
            results.append(deepcopy(call))
        results.sort(key=lambda x: x.get("created_at", 0), reverse=True)
        return results

    def create_call(self, **fields) -> dict:
        call_id = fields.get("id") or f"call-{uuid.uuid4().hex[:8]}"
        now = int(time.time())
        doc = {
            "id": call_id,
            "org_id": fields.get("org_id", "dheepak.ajith@hclguvi.in"),
            "lead_id": fields.get("lead_id", ""),
            "lead_name": fields.get("lead_name", ""),
            "lead_phone": fields.get("lead_phone", ""),
            "lead_email": fields.get("lead_email", ""),
            "bda_id": fields.get("bda_id", "bda-admin-101"),
            "bda_email": fields.get("bda_email", "dheepak.ajith@hclguvi.in"),
            "call_mode": fields.get("call_mode", "instant"),
            "status": fields.get("status", "scheduled"),
            "lifecycle_state": fields.get("lifecycle_state", "meeting_created"),
            "scheduled_time": fields.get("scheduled_time", now),
            "started_at": fields.get("started_at"),
            "ended_at": fields.get("ended_at"),
            "classify": fields.get("classify"),
            "media": fields.get("media", {"recording_url": None, "transcript_url": None, "chats": []}),
            "analysis": fields.get("analysis", {"status": "pending", "is_estimate": True}),
            "created_at": now,
            "updated_at": now
        }
        self._calls[call_id] = doc
        return deepcopy(doc)

    def update_call(self, call_id: str, **fields) -> Optional[dict]:
        if call_id not in self._calls:
            return None
        self._calls[call_id].update(fields)
        self._calls[call_id]["updated_at"] = int(time.time())
        return deepcopy(self._calls[call_id])

    def log_audit(self, action: str, correlation_id: str, user_email: str, details: Any):
        self._audit_logs.append({
            "id": f"audit-{uuid.uuid4().hex[:8]}",
            "action": action,
            "correlation_id": correlation_id,
            "user_email": user_email,
            "details": details,
            "timestamp": int(time.time())
        })

    def get_audit_logs(self, limit: int = 50) -> List[dict]:
        return deepcopy(self._audit_logs[-limit:])


store = Store()
