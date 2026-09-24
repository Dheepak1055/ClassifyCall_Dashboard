import logging
import json
import re
from typing import Any
from ..config import settings

class RedactingFormatter(logging.Formatter):
    """Sanitizes sensitive values such as API keys, tokens, and authorization headers from logs."""
    
    PATTERNS_TO_REDACT = [
        re.compile(r'("?(?:api[-_]?key|authToken|Authorization-key|X-API-Key|token|secret|password)"?\s*[:=]\s*)"([^"]+)"', re.IGNORECASE),
        re.compile(r'(Bearer\s+)[A-Za-z0-9\-._~+/]+=*', re.IGNORECASE),
        re.compile(r'(auth:)[A-Za-z0-9]+', re.IGNORECASE),
    ]

    def format(self, record: logging.LogRecord) -> str:
        msg = super().format(record)
        
        # Redact specific configured secrets if present
        for secret_val in [
            settings.CLASSIFY_API_KEY.get_secret_value(),
            settings.CLASSIFY_AUTH_TOKEN.get_secret_value(),
            settings.LEAD_CALL_API_KEY.get_secret_value(),
            settings.JWT_SECRET.get_secret_value(),
        ]:
            if secret_val and len(secret_val) > 4:
                msg = msg.replace(secret_val, "[REDACTED_SECRET]")

        # Redact known regex patterns
        for pattern in self.PATTERNS_TO_REDACT:
            msg = pattern.sub(r'\1"[REDACTED]"', msg)

        return msg


def setup_logger() -> logging.Logger:
    logger = logging.getLogger("bda_classify_dashboard")
    logger.setLevel(logging.INFO)
    
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = RedactingFormatter(
            fmt="%(asctime)s [%(levelname)s] [corr:%(correlation_id)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        
    return logger


_base_logger = setup_logger()

class ContextLogger:
    """Wrapper that ensures correlation_id is always available and payload is sanitized."""
    def __init__(self, logger: logging.Logger):
        self.logger = logger

    def _sanitize_dict(self, d: Any) -> Any:
        if isinstance(d, dict):
            sanitized = {}
            for k, v in d.items():
                if any(sec in k.lower() for sec in ["key", "token", "secret", "password", "auth"]):
                    sanitized[k] = "[REDACTED]"
                else:
                    sanitized[k] = self._sanitize_dict(v)
            return sanitized
        elif isinstance(d, list):
            return [self._sanitize_dict(i) for i in d]
        return d

    def info(self, msg: str, extra: dict = None):
        extra = extra or {}
        corr_id = extra.get("correlation_id", "system")
        if "body" in extra:
            extra["body"] = self._sanitize_dict(extra["body"])
        self.logger.info(msg, extra={"correlation_id": corr_id, **extra})

    def error(self, msg: str, extra: dict = None):
        extra = extra or {}
        corr_id = extra.get("correlation_id", "system")
        self.logger.error(msg, extra={"correlation_id": corr_id, **extra})

    def warning(self, msg: str, extra: dict = None):
        extra = extra or {}
        corr_id = extra.get("correlation_id", "system")
        self.logger.warning(msg, extra={"correlation_id": corr_id, **extra})


logger = ContextLogger(_base_logger)
