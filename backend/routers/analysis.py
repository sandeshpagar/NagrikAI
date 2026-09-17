import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from services.ai_analyzer import (
    analysis_service,
    GrievanceAnalysisInput,
    GrievanceAnalysisOutput,
)

logger = logging.getLogger("nagrikai.routers.analysis")

router = APIRouter(tags=["AI Grievance Analysis"])

class DirectAnalyzeRequest(BaseModel):
    complaint_text: str = Field(..., min_length=5, description="Citizen complaint text")
    language: Optional[str] = Field("English", description="Language of grievance")
    location: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Location metadata")
    evidence_analysis: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Evidence verification status")

class AnalyzeGrievanceRequest(BaseModel):
    actor_id: Optional[str] = None

@router.post("/analyze", response_model=GrievanceAnalysisOutput, status_code=status.HTTP_200_OK)
async def analyze_complaint_direct(request: DirectAnalyzeRequest):
    """
    Direct stateless AI analysis of a complaint text.
    Evaluates category, subcategory, priority, affected population, entities, and SOP recommendations.
    Does not mutate the database.
    """
    try:
        result = analysis_service.analyze_text(
            complaint_text=request.complaint_text,
            language=request.language or "English",
            location=request.location,
            evidence_analysis=request.evidence_analysis,
        )
        return result
    except Exception as err:
        logger.error(f"Error during direct analysis: {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(err)}"
        )

@router.post("/grievances/{id}/analyze", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def analyze_grievance_by_id(id: str, request: Optional[AnalyzeGrievanceRequest] = None):
    """
    Executes AI analysis for an existing grievance in the database.
    - Runs pluggable LLM adapter with safe heuristic fallback
    - Validates strict schema adherence
    - Persists results to public.ai_analyses
    - Updates public.grievances status and priority
    - Logs an immutable event in public.audit_logs
    """
    try:
        actor_id = request.actor_id if request else None
        res = analysis_service.analyze_and_persist(
            grievance_id=id,
            actor_id=actor_id
        )
        return res
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as err:
        logger.error(f"Error analyzing grievance {id}: {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Grievance Analysis failed: {str(err)}"
        )
