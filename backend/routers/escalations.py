import logging
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Query, status

from services.escalation_engine import (
    escalation_engine,
    EscalationEvent,
    TriggerEscalationRequest
)
from services.supabase_client import get_supabase

logger = logging.getLogger("nagrikai.routers.escalations")

router = APIRouter(tags=["Statutory Escalations"])

@router.get("/escalations/{grievance_id}", response_model=Dict[str, Any], summary="Get Escalation Ladder & Event History")
@router.get("/escalation/{grievance_id}", summary="Get Escalation Ladder (Alias)")
async def get_escalation_history(grievance_id: str):
    """
    Returns the dynamic escalation hierarchy chain and complete history of escalations for a grievance.
    """
    client = get_supabase()
    grv_data = None
    if client:
        try:
            res = client.table("grievances").select("*").or_(
                f"id.eq.{grievance_id},grievance_number.eq.{grievance_id}"
            ).execute()
            if res.data:
                grv_data = res.data[0]
        except Exception as e:
            logger.warning(f"Failed to fetch grievance: {e}")

    chain = escalation_engine.get_escalation_chain(grv_data)
    history = escalation_engine.get_history(grievance_id)
    current_level = int(grv_data.get("escalation_level", 0)) if grv_data else 0

    return {
        "success": True,
        "grievance_id": grievance_id,
        "current_level": current_level,
        "escalation_chain": chain,
        "history": [h.dict() for h in history]
    }

@router.post("/escalations/trigger", response_model=Dict[str, Any], status_code=status.HTTP_200_OK, summary="Trigger Statutory Escalation")
@router.post("/escalation/trigger", summary="Trigger Statutory Escalation (Alias)")
async def trigger_escalation(payload: TriggerEscalationRequest):
    """
    Elevates grievance to the next senior authority tier or a specified tier.
    Dispatches statutory notice email, updates status to ESCALATED, and writes Section 65B audit trail.
    """
    try:
        event = escalation_engine.execute_escalation(
            grievance_id=payload.grievance_id,
            target_level=payload.target_level,
            reason=payload.reason,
            actor_type=payload.actor_type or "ADMIN",
            actor_name=payload.actor_name or "Municipal Administrator"
        )
        return {
            "success": True,
            "message": f"Grievance {payload.grievance_id} successfully escalated to Level {event.to_level}.",
            "event": event.dict()
        }
    except Exception as e:
        logger.error(f"Error triggering escalation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to execute escalation: {str(e)}")
