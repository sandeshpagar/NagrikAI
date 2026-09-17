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
from services.supabase_client import get_supabase

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

# Include Routers under /api/v1 and root
app.include_router(grievances_router, prefix=settings.API_V1_STR)
app.include_router(grievances_router)
app.include_router(evidence_router, prefix=settings.API_V1_STR)
app.include_router(evidence_router)
app.include_router(analysis_router, prefix=settings.API_V1_STR)
app.include_router(analysis_router)
app.include_router(similarity_router, prefix=settings.API_V1_STR)
app.include_router(similarity_router)
app.include_router(authorities_router, prefix=settings.API_V1_STR)
app.include_router(authorities_router)
app.include_router(notifications_router, prefix=settings.API_V1_STR)
app.include_router(notifications_router)

@app.get("/health", tags=["System"])
async def health_check():
    """
    Health check endpoint reporting API status, AI backend mode, and Supabase connection.
    """
    supabase = get_supabase()
    db_status = "connected" if supabase is not None else "offline_or_unconfigured"
    
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "ai_provider": settings.AI_PROVIDER,
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
