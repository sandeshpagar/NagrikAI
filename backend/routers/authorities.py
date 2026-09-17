import logging
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from services.authority_mapper import (
    authority_mapper_service,
    AuthorityResolutionInput,
    AuthorityResolutionOutput,
    FALLBACK_AUTHORITY_RESOLUTION
)

logger = logging.getLogger("nagrikai.routers.authorities")

router = APIRouter(tags=["Authority Mapping & Escalation"])

class GrievanceAssignRequest(BaseModel):
    jurisdiction: Optional[str] = Field(None, description="Optional jurisdiction override")
    category: Optional[str] = Field(None, description="Optional category override")
    department: Optional[str] = Field(None, description="Optional department override")
    actor_id: Optional[str] = Field(None, description="ID of the officer or system assigning authority")

@router.post("/authorities/resolve", response_model=AuthorityResolutionOutput, status_code=status.HTTP_200_OK)
async def resolve_authority(payload: AuthorityResolutionInput):
    """
    Statutory 3-tuple resolution engine:
    jurisdiction + category + department -> responsible authority -> escalation chain
    Returns official name, government email, phone, office address, and 3-tier escalation hierarchy.
    Never blocks on unmapped grievances; safely routes to PMC Apex Central Grievance Cell.
    """
    try:
        result = authority_mapper_service.resolve(payload)
        return result
    except Exception as e:
        logger.error(f"Failed to resolve authority: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authority resolution failed: {str(e)}"
        )

@router.get("/authorities/mappings", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def get_mappings():
    """
    Returns the complete list of configured jurisdiction-category mapping rules and apex fallback.
    """
    try:
        rules = authority_mapper_service.get_configured_mappings()
        return {
            "total_rules": len(rules),
            "mappings": rules,
            "fallback_authority": FALLBACK_AUTHORITY_RESOLUTION["responsible_authority"]
        }
    except Exception as e:
        logger.error(f"Failed to list authority mappings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list authority mappings: {str(e)}"
        )

@router.post("/grievances/{id}/assign", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def assign_grievance_authority(id: str, payload: Optional[GrievanceAssignRequest] = None):
    """
    Resolves the responsible authority and assigns it to grievance {id}.
    Updates Supabase public.grievances and records an immutable audit log entry.
    """
    try:
        jurisdiction = payload.jurisdiction if payload else None
        category = payload.category if payload else None
        department = payload.department if payload else None
        actor_id = payload.actor_id if payload else None

        # Resolve authority for this grievance
        res_input = AuthorityResolutionInput(
            grievance_id=id,
            jurisdiction=jurisdiction,
            category=category,
            department=department
        )
        resolved = authority_mapper_service.resolve(res_input)

        # Persist assignment
        assign_result = authority_mapper_service.assign_to_grievance(
            grievance_id=id,
            resolved=resolved,
            actor_id=actor_id
        )

        return assign_result
    except Exception as e:
        logger.error(f"Failed to assign authority to grievance {id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to assign authority: {str(e)}"
        )
