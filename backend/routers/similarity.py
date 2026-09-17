import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from services.embedding_engine import similarity_service

logger = logging.getLogger("nagrikai.routers.similarity")

router = APIRouter(tags=["Embeddings & Similar Complaints"])

class SimilarityScanRequest(BaseModel):
    min_similarity: Optional[float] = Field(0.40, ge=0.0, le=1.0, description="Minimum cosine similarity threshold (0.0 - 1.0)")
    limit: Optional[int] = Field(5, ge=1, le=20, description="Max similar complaints to return")
    actor_id: Optional[str] = None

class ClusterSuggestRequest(BaseModel):
    threshold: Optional[float] = Field(0.80, ge=0.5, le=1.0, description="Cluster similarity grouping threshold")

@router.post("/grievances/{id}/similar", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def get_similar_grievances(id: str, payload: Optional[SimilarityScanRequest] = None):
    """
    Computes vector cosine similarity between grievance {id} and all registered complaints.
    - Employs 768-dimensional embeddings stored in Supabase pgvector
    - Returns ranked list of similar complaints with similarity scores
    - STRICT GUARDRAIL: Never automatically merges complaints; displays transparent scores to officers
    """
    try:
        min_sim = payload.min_similarity if payload else 0.40
        limit = payload.limit if payload else 5
        actor_id = payload.actor_id if payload else None

        result = similarity_service.find_similar(
            grievance_id=id,
            min_similarity=min_sim,
            limit=limit,
            actor_id=actor_id,
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as err:
        logger.error(f"Similarity scan error for grievance {id}: {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Similarity scan failed: {str(err)}"
        )

@router.get("/clusters", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def list_clusters():
    """
    Retrieves all active complaint clusters and associated grievance members.
    """
    try:
        clusters = similarity_service.get_clusters()
        return {
            "total_clusters": len(clusters),
            "clusters": clusters,
        }
    except Exception as err:
        logger.error(f"Cluster list error: {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch clusters: {str(err)}"
        )

@router.post("/clusters/suggest", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def suggest_clusters(payload: Optional[ClusterSuggestRequest] = None):
    """
    Analyzes active open complaints for high-density spatial/thematic clusters (similarity >= threshold).
    Proposes grouping recommendations for authorized officers without automatic merging.
    """
    try:
        threshold = payload.threshold if payload else 0.80
        suggestions = similarity_service.suggest_clusters(threshold=threshold)
        return suggestions
    except Exception as err:
        logger.error(f"Cluster suggestion error: {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cluster suggestion failed: {str(err)}"
        )
