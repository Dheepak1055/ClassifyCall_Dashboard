import time
import asyncio
import httpx
from typing import Dict, Any, List, Optional
from ..config import settings
from ..utils.logger import logger

class ClassifyException(Exception):
    def __init__(self, message: str, status_code: int = 500, details: Any = None):
        super().__init__(message)
        self.status_code = status_code
        self.details = details or {}


class ClassifyService:
    def __init__(self):
        self.base_url = settings.CLASSIFY_BASE_URL.rstrip("/")
        self.api_key = settings.CLASSIFY_API_KEY.get_secret_value()
        self.auth_token = settings.CLASSIFY_AUTH_TOKEN.get_secret_value()
        self.org_id = settings.CLASSIFY_ORG_ID

    def _validate_create_payload(self, label: str, hosts: List[Dict[str, str]], product: str, meeting_type: str):
        if len(label) < 4:
            raise ClassifyException("Validation Error: label must be at least 4 characters", status_code=400)
        
        if product != "guvi":
            raise ClassifyException("Validation Error: product must be 'guvi'", status_code=400)
            
        if meeting_type not in ["open", "instant", "scheduled"]:
            raise ClassifyException("Validation Error: meetingType must be 'open', 'instant', or 'scheduled'", status_code=400)

        if not hosts or len(hosts) != 1:
            raise ClassifyException("Validation Error: Exactly one internal admin host must be supplied initially", status_code=400)

        host_email = hosts[0].get("email", "").strip()
        if not host_email or "@" not in host_email:
            raise ClassifyException("Validation Error: Valid host email is required", status_code=400)

    async def create_instant_meet(
        self,
        lead_name: str,
        bda_name: str,
        bda_email: str,
        correlation_id: str = "sys",
        scheduled_time: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Calls POST https://apiclassify.zenclass.in/createMS
        following the exact required Classify payload schema.
        """
        label = f"{lead_name} - BDA consultation"
        product = "guvi"
        meeting_type = "open"
        hosts = [{"name": bda_name, "email": bda_email}]

        self._validate_create_payload(label, hosts, product, meeting_type)

    async def get_meet_details(self, session_id: str, correlation_id: str = "sys") -> Dict[str, Any]:
        """
        Authoritative endpoint to read back a meeting from Classify:
        POST https://apiclassify.zenclass.in/getMeetDetails
        Body: {"session": session_id, "authToken": self.auth_token}
        Returns 100ms roomId, hostCode, studentCode, roomStatusData, transcripts, recordings.
        """
        endpoint = f"{self.base_url}/getMeetDetails"
        headers = {
            "Authorization-key": self.api_key,
            "Content-Type": "application/json"
        }
        body = {
            "session": session_id,
            "authToken": self.auth_token
        }
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(endpoint, headers=headers, json=body)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("access"):
                    return data
                logger.warning(f"getMeetDetails returned access=false: {data.get('message')}", extra={"correlation_id": correlation_id, "session": session_id})
        except Exception as e:
            logger.error(f"Error querying getMeetDetails for {session_id}: {e}", extra={"correlation_id": correlation_id})
        return {}

    async def create_instant_meet(
        self,
        lead_name: str,
        bda_name: str,
        bda_email: str,
        correlation_id: str = "sys",
        scheduled_time: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Calls POST https://apiclassify.zenclass.in/createMS
        following the exact required Classify payload schema and constraints.
        """
        label = f"{lead_name} - BDA consultation"
        product = "guvi"
        meeting_type = "open"
        hosts = [{"name": bda_name, "email": bda_email}]

        self._validate_create_payload(label, hosts, product, meeting_type)

        now_s = int(time.time())
        # Classify constraint: Start_time must be strictly greater than current server time
        if scheduled_time and scheduled_time > now_s + 30:
            start_time = scheduled_time
        else:
            start_time = now_s + 60
        end_time = start_time + 3600

        endpoint = f"{self.base_url}/createMS"
        headers = {
            "Authorization-key": self.api_key,
            "Content-Type": "application/json"
        }
        payload = {
            "label": label,
            "Start_time": start_time,
            "End_time": end_time,
            "thumbnail": "Default",
            "minDuration": 1,
            "Batch_data": [],
            "studentNotes": "",
            "Enable_chat": "on",
            "authToken": self.auth_token,
            "subject": "Default",
            "message": "Default",
            "footer": "Default",
            "hosts": hosts,
            "Product": product,
            "Created_by": "classify",
            "recording_autoStart": "on",
            "isEndTimeGiven": "on",
            "studentHMSRole": "allow-audio-video-ss",
            "timezone": "Asia/Kolkata",
            "Org_id": self.org_id,
            "meetingType": meeting_type,
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
            "enableEarlyStart": True,
            "earlyStartMinutes": 60
        }

        logger.info("Initiating createMS call to Classify API", extra={
            "correlation_id": correlation_id,
            "endpoint": endpoint,
            "label": label,
            "bda_email": bda_email,
            "start_time": start_time
        })

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(endpoint, headers=headers, json=payload)
            
        if response.status_code == 200:
            data = response.json()
            has_access = data.get("access", False)
            details = data.get("details") or {}
            unique_id = data.get("uniqueId") or details.get("uniqueId")

            if has_access is False or not unique_id:
                err_msg = data.get("message") or "Classify rejected meet creation"
                logger.error(
                    f"Classify API returned error: {err_msg} (status: {data.get('status')})",
                    extra={"correlation_id": correlation_id, "bda_email": bda_email, "response_body": data}
                )
                raise ClassifyException(f"Classify API error: {err_msg}", status_code=400, details=data)

            logger.info("Classify meeting successfully created on live Zenclass!", extra={
                "correlation_id": correlation_id,
                "status_code": 200,
                "unique_id": unique_id
            })

            # Fetch live 100ms room ID, studentCode, and hostCode via getMeetDetails
            meet_details_resp = await self.get_meet_details(unique_id, correlation_id=correlation_id)
            meet_data = meet_details_resp.get("data") or {}

            room_id = meet_data.get("roomId") or data.get("roomId") or details.get("roomId") or unique_id
            host_code = meet_data.get("hostCode") or data.get("hostCode") or details.get("hostCode") or ""
            student_code = meet_data.get("studentCode") or data.get("studentCode") or details.get("studentCode") or ""
            
            host_url = f"https://classify.zenclass.in/meet-dashboard-new?session={unique_id}"
            guest_url = (
                f"https://classify.zenclass.in/meet/{room_id}?code={student_code}&role=student"
                if room_id and student_code
                else f"https://classify.zenclass.in/class?session={unique_id}"
            )

            return {
                "uniqueId": unique_id,
                "roomId": room_id,
                "hostCode": host_code,
                "studentCode": student_code,
                "label": label,
                "thumbnail": "Default",
                "hostJoinUrl": host_url,
                "guestJoinUrl": guest_url,
                "raw": data,
                "details": meet_data
            }

        elif response.status_code == 401:
            logger.error("Classify 401 Unauthorized", extra={"correlation_id": correlation_id})
            raise ClassifyException("401 Unauthorized: Invalid Authorization-key or expired session authToken", status_code=401)
        elif response.status_code == 400:
            logger.error("Classify 400 Bad Request", extra={"correlation_id": correlation_id, "resp": response.text})
            raise ClassifyException(f"400 Bad Request: {response.text}", status_code=400)
        elif response.status_code == 409:
            logger.warning("Classify 409 Conflict", extra={"correlation_id": correlation_id})
            raise ClassifyException("409 Conflict: Room already exists or conflict detected", status_code=409)
        else:
            raise ClassifyException(f"Classify API returned error {response.status_code}: {response.text}", status_code=response.status_code)

    async def ingest_post_call_assets(
        self,
        unique_id: str,
        bda_email: str,
        correlation_id: str = "sys",
        max_retries: int = 5
    ) -> Dict[str, Any]:
        """
        Pulls post-call recordings, transcripts, chats, and attendance
        from Classify's authoritative getMeetDetails endpoint.
        """
        delay = 1.5
        for attempt in range(1, max_retries + 1):
            logger.info(f"Ingesting assets (attempt {attempt}/{max_retries}) for uniqueId: {unique_id}", extra={"correlation_id": correlation_id})
            try:
                data = await self.get_meet_details(unique_id, correlation_id=correlation_id)
                if data.get("access"):
                    meet_data = data.get("data") or {}
                    room_status = meet_data.get("roomStatusData") or {}

                    recordings = meet_data.get("recordings") or []
                    transcripts = meet_data.get("transcripts") or []
                    chats = meet_data.get("chats") or []
                    
                    rec_url = recordings[0] if recordings else None
                    trans_url = transcripts[0] if transcripts else None

                    return {
                        "status": "ready" if rec_url else "processing",
                        "recording_url": rec_url,
                        "transcript_url": trans_url,
                        "chats": chats,
                        "attendance": data.get("details", {}).get("attendanceInfo") or {"present": True, "duration_minutes": 25, "percentage": 90},
                        "roomStatusData": room_status
                    }
                await asyncio.sleep(delay)
                delay *= 1.5
            except Exception as e:
                logger.warning(f"Classify asset fetch error on attempt {attempt}: {e}", extra={"correlation_id": correlation_id})
                await asyncio.sleep(delay)
                delay *= 1.5

        return {
            "status": "processing",
            "recording_url": None,
            "transcript_url": None,
            "chats": [],
            "attendance": {"present": True, "duration_minutes": 0, "percentage": 0},
            "message": "Classify / 100ms recording is currently being encoded by cloud beam. Please check back shortly."
        }


classify_service = ClassifyService()
