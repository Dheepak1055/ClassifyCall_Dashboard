import time
import uvicorn
import os
from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .config import settings
from .utils.logger import logger
from .router import meetings, leads, analysis, webhook, debug, calls
from .middleware.auth import auth_middleware

app = FastAPI(
    title="HCL GUVI Classify BDA Video Call Integration API",
    version="1.0.0",
    description="Secure Backend Integration Layer for BDA Video Call Dashboard with Classify & Lead Call API"
)

static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sanitized logging middleware with correlation ID
@app.middleware("http")
async def log_requests(request: Request, call_next):
    corr_id = request.headers.get("x-correlation-id") or f"req-{int(time.time() * 1000)}"
    request.state.correlation_id = corr_id
    logger.info(f"Incoming {request.method} {request.url.path}", extra={"correlation_id": corr_id})
    start_time = time.time()
    
    response = await call_next(request)
    duration_ms = round((time.time() - start_time) * 1000, 2)
    
    logger.info(f"Completed {request.method} {request.url.path} with status {response.status_code} in {duration_ms}ms", extra={"correlation_id": corr_id})
    response.headers["X-Correlation-ID"] = corr_id
    return response

# Register API Routers
# /api/calls: Used by the BDA dashboard UI
app.include_router(calls.router, prefix="/api")

# /api/meetings: Dedicated Classify instant meeting and guest-invite endpoints
app.include_router(meetings.router, prefix="/api/meetings", dependencies=[Depends(auth_middleware)])

# /api/leads: Lead Call API search, calls, transcript, and recording proxy
app.include_router(leads.router, prefix="/api/leads", dependencies=[Depends(auth_middleware)])

# /api/analysis: AI post-call scoring and analysis endpoints
app.include_router(analysis.router, prefix="/api/analysis", dependencies=[Depends(auth_middleware)])

# /api/webhook: Webhook ingestion (no auth header needed for external Classify callback)
app.include_router(webhook.router, prefix="/api/webhook")

# /api/debug: Masked config status
app.include_router(debug.router, prefix="/api")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "bda-classify-backend",
        "classify_org_id": settings.CLASSIFY_ORG_ID,
        "api_key_loaded": bool(settings.CLASSIFY_API_KEY),
        "auth_token_loaded": bool(settings.CLASSIFY_AUTH_TOKEN)
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
