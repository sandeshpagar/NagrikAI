import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status

from services.response_interpreter import (
    response_interpreter_service,
    OfficerActionSubmission,
    ConfirmRecommendationRequest,
    ModifyRecommendationRequest,
    ValidatedOfficerResponse,
)
from services.supabase_client import get_supabase
from services.grievance_agent.graph import get_grievance_agent

logger = logging.getLogger("nagrikai.routers.officer_response")

router = APIRouter(tags=["Authority Response Workflow"])

@router.post("/authority/response", response_model=Dict[str, Any], status_code=status.HTTP_200_OK, summary="Submit Authority Response")
async def submit_authority_response(payload: OfficerActionSubmission):
    """
    Submits an officer response, directive, status change, or expected action date.
    Interprets input strictly through validated structured output models.
    Enforces the ambiguity guardrail: vague inputs preserve previous status.
    """
    client = get_supabase()
    grv_data = None
    if client:
        try:
            res = client.table("grievances").select("*").or_(
                f"id.eq.{payload.grievance_id},grievance_number.eq.{payload.grievance_id}"
            ).execute()
            if res.data:
                grv_data = res.data[0]
        except Exception as e:
            logger.warning(f"Failed to fetch grievance: {e}")

    # Interpret structured response
    validated: ValidatedOfficerResponse = response_interpreter_service.interpret_submission(
        submission=payload,
        current_grievance=grv_data
    )

    # Persist and audit
    apply_result = response_interpreter_service.apply_response(
        submission=payload,
        validated=validated
    )

    # Trigger single cycle of LangGraph agent to handle notifications & timeline progression
    try:
        agent = get_grievance_agent()
        agent.step(payload.grievance_id)
    except Exception as agent_err:
        logger.warning(f"Could not step LangGraph agent: {agent_err}")

    return {
        "success": True,
        "grievance_id": payload.grievance_id,
        "is_ambiguous": validated.is_ambiguous,
        "clarification_requested": validated.clarification_requested,
        "new_status": validated.status,
        "validated_response": validated.dict(),
        "audit": apply_result
    }

@router.get("/authority/response", response_model=Dict[str, Any], status_code=status.HTTP_200_OK, summary="Test/Inspect Authority Response Endpoint")
async def get_authority_response(
    grievance_id: str = "GRV-2026-1042",
    directive_text: Optional[str] = None,
    status_intent: Optional[str] = None
):
    """
    Browser-accessible GET verification endpoint.
    Pass ?directive_text=maybe+later to test the Ambiguity Guardrail.
    """
    test_directive = directive_text or "Road repair squad dispatched to Sinhagad Road junction. Tar patching scheduled for tomorrow."
    submission = OfficerActionSubmission(
        grievance_id=grievance_id,
        directive_text=test_directive if directive_text is not None else None,
        status_intent=status_intent,
        officer_name="PMC Authority Officer (Browser Inspection)"
    )
    validated = response_interpreter_service.interpret_submission(
        submission=submission,
        current_grievance={"id": grievance_id, "status": "NOTIFIED"}
    )
    return {
        "success": True,
        "mode": "GET_VERIFICATION",
        "grievance_id": grievance_id,
        "directive_tested": directive_text,
        "is_ambiguous": validated.is_ambiguous,
        "clarification_requested": validated.clarification_requested,
        "status": validated.status,
        "validated_response": validated.dict(),
        "info": "Send HTTP POST to this endpoint to execute production database updates."
    }

@router.post("/authority/confirm-recommendation", response_model=Dict[str, Any], status_code=status.HTTP_200_OK, summary="Confirm AI SOP Recommendation")
async def confirm_recommendation_endpoint(payload: ConfirmRecommendationRequest):
    """
    One-click official confirmation of the AI-generated SOP recommendation.
    Transitions grievance to IN_PROGRESS and logs an immutable audit event.
    """
    try:
        result = response_interpreter_service.confirm_recommendation(payload)
        return {
            "success": True,
            "message": f"Recommendation confirmed for grievance {payload.grievance_id}.",
            "data": result
        }
    except Exception as e:
        logger.error(f"Error confirming recommendation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to confirm recommendation: {str(e)}")

@router.get("/authority/confirm-recommendation", response_model=Dict[str, Any], status_code=status.HTTP_200_OK, summary="Inspect AI SOP Confirmation Endpoint")
async def get_confirm_recommendation(grievance_id: str = "GRV-2026-1042"):
    """
    Browser-accessible GET endpoint for SOP confirmation verification.
    """
    return {
        "success": True,
        "mode": "GET_VERIFICATION",
        "grievance_id": grievance_id,
        "message": f"AI SOP Confirmation Endpoint is active for {grievance_id}.",
        "data": {
            "status": "IN_PROGRESS",
            "recommendation_decision": "CONFIRMED",
            "applied_directive": "Confirmed AI Recommended SOP: Proceeding with standard municipal dispatch."
        },
        "info": "Send HTTP POST with { grievance_id, officer_name } to execute live database confirmation."
    }

@router.post("/authority/modify-recommendation", response_model=Dict[str, Any], status_code=status.HTTP_200_OK, summary="Modify AI SOP Recommendation")
async def modify_recommendation_endpoint(payload: ModifyRecommendationRequest):
    """
    Allows the officer to override or modify the AI recommendation with custom operational actions and reasoning.
    """
    try:
        result = response_interpreter_service.modify_recommendation(payload)
        return {
            "success": True,
            "message": f"Recommendation modified for grievance {payload.grievance_id}.",
            "data": result
        }
    except Exception as e:
        logger.error(f"Error modifying recommendation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to modify recommendation: {str(e)}")

@router.get("/authority/modify-recommendation", response_model=Dict[str, Any], status_code=status.HTTP_200_OK, summary="Inspect AI SOP Modification Endpoint")
async def get_modify_recommendation(
    grievance_id: str = "GRV-2026-1042",
    custom_action: str = "Deploy specialized heavy roller compaction squad",
    reason: str = "Monsoon heavy waterlogging requires hot-mix asphalt rather than standard cold-mix."
):
    """
    Browser-accessible GET endpoint for SOP modification verification.
    """
    return {
        "success": True,
        "mode": "GET_VERIFICATION",
        "grievance_id": grievance_id,
        "message": f"AI SOP Modification Endpoint is active for {grievance_id}.",
        "data": {
            "status": "IN_PROGRESS",
            "recommendation_decision": "MODIFIED",
            "custom_action": custom_action,
            "reason": reason
        },
        "info": "Send HTTP POST with { grievance_id, custom_action, reason, officer_name } to execute live override."
    }

@router.post("/authority/interpret-directive", response_model=Dict[str, Any], summary="Stateless Directive Interpretation")
async def interpret_directive_stateless(payload: OfficerActionSubmission):
    """
    Direct stateless interpretation of an officer directive string.
    Returns the parsed intent, ambiguity flag, and plain-language summary without mutating the database.
    """
    validated = response_interpreter_service.interpret_submission(submission=payload)
    return {
        "success": True,
        "validated": validated.dict()
    }

@router.get("/authority/interpret-directive", response_model=Dict[str, Any], summary="Stateless Directive Interpretation via GET")
async def get_interpret_directive_stateless(
    grievance_id: str = "GRV-2026-1042",
    directive_text: Optional[str] = None
):
    """
    Browser-accessible GET endpoint for testing stateless directive interpretation directly via query string.
    Try '?directive_text=maybe later' to test Ambiguity Guardrail.
    """
    sample_text = directive_text if directive_text is not None else "Road repair squad dispatched to Sinhagad Road junction. Tar patching and pothole compaction scheduled for tomorrow morning."
    submission = OfficerActionSubmission(
        grievance_id=grievance_id,
        directive_text=sample_text,
        officer_name="Municipal Desk"
    )
    validated = response_interpreter_service.interpret_submission(
        submission=submission,
        current_grievance={"id": grievance_id, "status": "NOTIFIED"}
    )
    return {
        "success": True,
        "directive_text": sample_text,
        "is_ambiguous": validated.is_ambiguous,
        "status": validated.status,
        "clarification_requested": validated.clarification_requested,
        "validated": validated.dict()
    }
