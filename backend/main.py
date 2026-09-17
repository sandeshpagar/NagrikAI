import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers.grievances import router as grievances_router
from routers.evidence import router as evidence_router
from routers.analysis import router as analysis_router
from routers.similarity import router as similarity_router
from routers.authorities import router as authorities_router
from routers.notifications import router as notifications_router
from routers.agent import router as agent_router
from routers.sla import router as sla_router
from routers.escalations import router as escalations_router
from routers.officer_response import router as officer_response_router
from routers.analytics import router as analytics_router
from services.supabase_client import get_supabase
from services.llm_provider.factory import get_llm_provider

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("nagrikai.api")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="NagrikAI Autonomous Multi-Agent Civic Grievance Resolution Platform API",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers under /api/v1, /api, and root for maximum client compatibility
all_routers = [
    grievances_router,
    evidence_router,
    analysis_router,
    similarity_router,
    authorities_router,
    notifications_router,
    agent_router,
    sla_router,
    escalations_router,
    officer_response_router,
    analytics_router,
]
for r in all_routers:
    app.include_router(r, prefix=settings.API_V1_STR)
    app.include_router(r, prefix="/api")
    app.include_router(r)

@app.get("/health", tags=["System"])
async def health_check():
    """
    Health check endpoint reporting API status, AI backend mode, and Supabase connection.
    """
    supabase = get_supabase()
    db_status = "connected" if supabase is not None else "offline_or_unconfigured"
    llm_provider = get_llm_provider()
    
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "ai_provider": settings.AI_PROVIDER,
        "active_llm": llm_provider.name,
        "database": db_status,
        "supabase_url": settings.NEXT_PUBLIC_SUPABASE_URL,
    }

@app.get("/", tags=["System"])
async def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/health",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
