import time
import jwt
from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from ..config import settings
from ..utils.logger import logger

security = HTTPBearer(auto_error=False)

class BDAUser:
    def __init__(self, user_id: str, email: str, name: str, role: str = "bda", org_id: str = None):
        self.id = user_id
        self.email = email
        self.name = name
        self.role = role
        self.org_id = org_id or settings.CLASSIFY_ORG_ID

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "role": self.role,
            "org_id": self.org_id
        }


def get_current_user(request: Request) -> BDAUser:
    """Extracts current authenticated BDA user from JWT or returns default internal GUVI admin BDA."""
    token = None
    auth_hdr = request.headers.get("Authorization") or request.headers.get("authorization")
    if auth_hdr and auth_hdr.startswith("Bearer "):
        token = auth_hdr.split(" ")[1]

    if token:
        try:
            payload = jwt.decode(token, settings.JWT_SECRET.get_secret_value(), algorithms=["HS256"])
            return BDAUser(
                user_id=payload.get("sub", "bda-001"),
                email=payload.get("email") if ("@" in (payload.get("email") or "")) else "dheepak.ajith@hclguvi.in",
                name=payload.get("name", "Dheepak Ajith (BDA Admin)"),
                role=payload.get("role", "admin"),
                org_id=payload.get("org_id", settings.CLASSIFY_ORG_ID)
            )
        except Exception as e:
            logger.warning("Invalid JWT provided, falling back to authenticated admin context", extra={"error": str(e)})

    # Default internal GUVI admin BDA
    return BDAUser(
        user_id="bda-admin-101",
        email="dheepak.ajith@hclguvi.in",
        name="Dheepak Ajith",
        role="admin",
        org_id=settings.CLASSIFY_ORG_ID
    )


async def auth_middleware(request: Request):
    """Dependency that attaches authenticated user to request state."""
    user = get_current_user(request)
    request.state.user = user
    return user
