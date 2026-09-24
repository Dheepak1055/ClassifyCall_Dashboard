from fastapi import APIRouter, Depends
from ..config import settings

router = APIRouter()

@router.get("/debug/config")
async def get_config_status():
    """Return a masked view of loaded environment variables for verification.
    Sensitive values are redacted; presence is indicated by boolean flags.
    """
    return {
        "CLASSIFY_API_KEY": "***" if settings.CLASSIFY_API_KEY.get_secret_value() else None,
        "CLASSIFY_AUTH_TOKEN": "***" if settings.CLASSIFY_AUTH_TOKEN.get_secret_value() else None,
        "CLASSIFY_ORG_ID": settings.CLASSIFY_ORG_ID,
        "LEAD_CALL_API_KEY": "***" if settings.LEAD_CALL_API_KEY.get_secret_value() else None,
        "JWT_SECRET": "***" if settings.JWT_SECRET.get_secret_value() else None,
        "DATABASE_URL": settings.DATABASE_URL,
        "PORT": settings.PORT,
    }
