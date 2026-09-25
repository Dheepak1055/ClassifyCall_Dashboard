"""
Classify (apiclassify.zenclass.in) video-call provider.

Mirrors the shape of providers/leadsource/*: a thin async client, a
mock-mode branch for staging (DATA_SOURCE / CLASSIFY_MOCK), and no
business logic beyond "talk to the external API and hand back typed data".
Call scheduling/analysis decisions live in routes/calls.py and
services/call_analysis.py, not here.
"""

from __future__ import annotations

import time
import uuid
from dataclasses import dataclass
from typing import Literal

import httpx

from app.config import settings  # TODO: confirm this is the real settings import path
from app.redis.client import redis_client  # TODO: confirm the real redis wrapper import path

CLASSIFY_BASE_URL = settings.CLASSIFY_BASE_URL  # e.g. https://apiclassify.zenclass.in
CLASSIFY_API_KEY = settings.CLASSIFY_API_KEY      # static "Authorization-key" header secret
CLASSIFY_ORG_ID = settings.CLASSIFY_ORG_ID
CLASSIFY_MOCK = settings.CLASSIFY_MOCK            # bool; force True on staging

AUTH_TOKEN_REDIS_KEY = "classify:admin_auth_token"
AUTH_TOKEN_SAFETY_MARGIN_SECONDS = 60  # refresh a bit before actual expiry


class ClassifyError(Exception):
    def __init__(self, message: str, status_code: int | None = None, code: str | None = None):
        super().__init__(message)
        self.status_code = status_code
        self.code = code  # e.g. "E_CLASSIFY_UNAUTHORIZED", "E_CLASSIFY_CONFLICT"


@dataclass
class ClassifyHost:
    name: str
    email: str


@dataclass
class ClassifyMeet:
    unique_id: str
    room_id: str
    host_code: str
    student_code: str
    label: str
    thumbnail: str
    created_at: int
    raw: dict  # full response, kept for debugging / audit log


class ClassifyAuthService:
    """
    Owns the Classify *session* token (`authToken` in the createInstantMeet
    body) — NOT the static Authorization-key header, which is just
    CLASSIFY_API_KEY passed straight through on every call.

    ASSUMPTION (see README §6.1): the actual login/refresh endpoint isn't
    documented in the brief. `_login()` below is a placeholder — swap it for
    the real call once Classify confirms how a service/admin account obtains
    a session token, and how long it lasts.
    """

    async def get_token(self, force_refresh: bool = False) -> str:
        if not force_refresh:
            cached = await redis_client.get(AUTH_TOKEN_REDIS_KEY)
            if cached:
                return cached.decode() if isinstance(cached, bytes) else cached
        return await self._login_and_cache()

    async def _login_and_cache(self) -> str:
        # TODO: replace with the real Classify admin-login call once documented.
        # Expected shape, by analogy with the rest of the API:
        #   POST {CLASSIFY_BASE_URL}/auth/login  (or similar)
        #   headers: {"Authorization-key": CLASSIFY_API_KEY}
        #   body: {"email": settings.CLASSIFY_ADMIN_EMAIL, "secret": settings.CLASSIFY_ADMIN_SECRET}
        # -> {"authToken": "...", "expiresIn": 3600}
        async with httpx.AsyncClient(base_url=CLASSIFY_BASE_URL, timeout=15) as client:
            resp = await client.post(
                settings.CLASSIFY_ADMIN_LOGIN_URL,
                headers={"Authorization-key": CLASSIFY_API_KEY},
                json={
                    "email": settings.CLASSIFY_ADMIN_EMAIL,
                    "secret": settings.CLASSIFY_ADMIN_SECRET,  # decrypt via the existing crypto service before use
                },
            )
        if resp.status_code != 200:
            raise ClassifyError(
                "Could not obtain a Classify admin session",
                status_code=resp.status_code,
                code="E_CLASSIFY_AUTH_FAILED",
            )
        data = resp.json()
        token = data["authToken"]
        ttl = max(int(data.get("expiresIn", 3600)) - AUTH_TOKEN_SAFETY_MARGIN_SECONDS, 30)
        await redis_client.set(AUTH_TOKEN_REDIS_KEY, token, ex=ttl)
        return token


auth_service = ClassifyAuthService()


def build_join_url(room_id: str, code: str, role: Literal["host", "student"], unique_id: Optional[str] = None) -> str:
    """
    Builds the joining URL for Classify meets.
    - Host meet URL: https://classify.zenclass.in/meet/<room_id>?code=<code>&role=host
    - Student guest link: https://classify.zenclass.in/meet/<room_id>?code=<code>&role=student
    """
    if room_id and code:
        return f"https://classify.zenclass.in/meet/{room_id}?code={code}&role={role}"
    session_id = unique_id or room_id
    return f"https://classify.zenclass.in/meet-dashboard-new?session={session_id}"


async def create_instant_meet(
    *,
    label: str,
    hosts: list[ClassifyHost],
    org_id: str | None = None,
    student_role: str = "student",
    auto_recording_start: Literal["on", "off"] = "off",
    created_by: str = "admin",
) -> ClassifyMeet:
    """
    Calls POST /createInstantMeet. Used for both "instant" and "scheduled"
    DORA calls — see README §2 for why there's only ever one Classify call
    type. Raises ClassifyError on any non-200.
    """
    if CLASSIFY_MOCK:
        return _mock_meet(label, hosts)

    if len(label) < 4:
        raise ValueError("label must be at least 4 characters")
    if not hosts:
        raise ValueError("hosts must be non-empty")
    if len({h.email.lower() for h in hosts}) != len(hosts):
        raise ValueError("duplicate host emails")

    token = await auth_service.get_token()
    now_s = int(time.time())
    start_s = now_s + 120
    end_s = start_s + 3600

    payload = {
        "label": label,
        "start_time": start_s,
        "end_time": end_s,
        "thumbnail": "Default",
        "minDuration": 1,
        "batch_data": [],
        "studentNotes": "",
        "enable_chat": "on",
        "authToken": token,
        "subject": "Default",
        "message": "Default",
        "footer": "Default",
        "hosts": [{"name": h.name, "email": h.email} for h in hosts],
        "product": "guvi",
        "created_by": "classify",
        "recording_autoStart": "on",
        "isEndTimeGiven": "on",
        "studentHMSRole": "allow-audio-video-ss",
        "timezone": "Asia/Kolkata",
        "org_id": org_id or CLASSIFY_ORG_ID,
        "meetingType": "open",
        "repeatSchedule": {"type": "noRepeat"},
        "guestConfig": {
            "isGuestParticipantAllowed": True,
            "guestInformationCollectionFields": []
        },
        "isPollEnabled": False,
        "selectedPollTemplateIds": [],
        "isQuizEnabled": False,
        "selectedQuizTemplateIds": [],
        "breakoutroom_enabled": False,
        "max_breakoutroom": 0,
        "enableEarlyStart": False,
        "earlyStartMinutes": 0
    }

    async with httpx.AsyncClient(base_url=CLASSIFY_BASE_URL, timeout=20) as client:
        resp = await client.post(
            "/createMS",
            headers={"Authorization-key": CLASSIFY_API_KEY},
            json=payload,
        )

    if resp.status_code == 401:
        # Could be an expired authToken (not the static key) — refresh once and retry.
        token = await auth_service.get_token(force_refresh=True)
        payload["authToken"] = token
        async with httpx.AsyncClient(base_url=CLASSIFY_BASE_URL, timeout=20) as client:
            resp = await client.post(
                "/createMS",
                headers={"Authorization-key": CLASSIFY_API_KEY},
                json=payload,
            )

    if resp.status_code == 400:
        raise ClassifyError(f"Classify rejected the request: {resp.text}", 400, "E_CLASSIFY_BAD_REQUEST")
    if resp.status_code == 401:
        raise ClassifyError("Classify auth failed twice — check API key / admin credentials", 401, "E_CLASSIFY_UNAUTHORIZED")
    if resp.status_code == 409:
        raise ClassifyError("Classify could not allocate a room", 409, "E_CLASSIFY_CONFLICT")
    if resp.status_code != 200:
        raise ClassifyError(f"Unexpected Classify response: {resp.status_code}", resp.status_code)

    body = resp.json()
    details = body["details"]
    return ClassifyMeet(
        unique_id=details["uniqueId"],
        room_id=details["roomId"],
        host_code=details["hostCode"],
        student_code=details["studentCode"],
        label=details["label"],
        thumbnail=details.get("thumbnail", ""),
        created_at=details["created_at"],
        raw=body,
    )


def _mock_meet(label: str, hosts: list[ClassifyHost]) -> ClassifyMeet:
    """Offline fixture, mirrors mock leadsource provider — used when CLASSIFY_MOCK=true (staging)."""
    now = int(time.time())
    room_id = f"mock-room-{uuid.uuid4().hex[:8]}"
    return ClassifyMeet(
        unique_id=str(uuid.uuid4()),
        room_id=room_id,
        host_code=f"mock-host-{uuid.uuid4().hex[:6]}",
        student_code=f"mock-student-{uuid.uuid4().hex[:6]}",
        label=label,
        thumbnail="https://classifyprod.s3.ap-south-1.amazonaws.com/thumbnails/mock.jpg",
        created_at=now,
        raw={"mock": True, "hosts": [h.__dict__ for h in hosts]},
    )
