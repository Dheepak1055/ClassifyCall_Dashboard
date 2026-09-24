import os
from pathlib import Path
from dotenv import load_dotenv

# Search and load environment variables from possible locations
BASE_DIR = Path(__file__).resolve().parent.parent
env_candidates = [
    BASE_DIR / ".env",
    BASE_DIR / "python.env",
    BASE_DIR.parent / ".env",
    BASE_DIR.parent / "python.env",
]
for env_file in env_candidates:
    if env_file.exists():
        load_dotenv(env_file, override=False)


class SecretStr:
    """Masks secret values in string/repr representation to prevent accidental logging."""
    def __init__(self, value: str = ""):
        self._val = value or ""

    def get_secret_value(self) -> str:
        return self._val

    def __str__(self) -> str:
        return "**********" if self._val else ""

    def __repr__(self) -> str:
        return "SecretStr('**********')" if self._val else "SecretStr('')"

    def __bool__(self) -> bool:
        return bool(self._val)


class Settings:
    # Classify Configuration
    CLASSIFY_BASE_URL: str = os.getenv("CLASSIFY_BASE_URL", "https://apiclassify.zenclass.in")
    CLASSIFY_API_KEY: SecretStr = SecretStr(os.getenv("CLASSIFY_API_KEY", ""))
    CLASSIFY_AUTH_TOKEN: SecretStr = SecretStr(os.getenv("CLASSIFY_AUTH_TOKEN", ""))
    CLASSIFY_ORG_ID: str = os.getenv("CLASSIFY_ORG_ID", "dheepak.ajith@hclguvi.in")

    # Lead Call API Configuration
    LEAD_CALL_BASE_URL: str = os.getenv("LEAD_CALL_BASE_URL", "https://lead-call-api.codingpuppet.com")
    LEAD_CALL_API_KEY: SecretStr = SecretStr(os.getenv("LEAD_CALL_API_KEY", ""))

    # OpenAI Whisper Configuration for Speech-to-Text
    OPENAI_API_KEY: SecretStr = SecretStr(os.getenv("OPENAI_API_KEY", ""))
    WHISPER_MODEL: str = os.getenv("WHISPER_MODEL", "whisper-1")

    # Auth & Database
    JWT_SECRET: SecretStr = SecretStr(os.getenv("JWT_SECRET", "bda_secure_jwt_secret_token_change_in_production"))
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://localhost:5432/bda_dashboard")

    # Server settings
    PORT: int = int(os.getenv("PORT", "4000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")


settings = Settings()
