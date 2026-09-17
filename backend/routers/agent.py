import logging
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from services.grievance_agent.graph import get_grievance_agent
from services.llm_provider.factory import get_llm_provider
from config import settings

logger = logging.getLogger("nagrikai.routers.agent")

router = APIRouter(
    prefix="/agent",
    tags=["LangGraph Grievance Agent"]
)

class RunAgentRequest(BaseModel):
    grievance_id: str = Field(..., description="ID or ticket number of the grievance (e.g. GRV-2026-1042)")
    max_steps: Optional[int] = Field(6, ge=1, le=20, description="Max node steps to run in this execution cycle")

class StepAgentRequest(BaseModel):
    grievance_id: str = Field(..., description="ID or ticket number of the grievance")

class SimulateAuthorityResponseRequest(BaseModel):
    grievance_id: str = Field(..., description="ID or ticket number of the grievance")
    directive: str = Field(..., description="Officer directive or resolution note")
    action_type: str = Field("ACTION_SCHEDULED", description="ACTION_SCHEDULED or RESOLVED")
    expected_resolution_at: Optional[str] = Field(None, description="ISO timestamp of scheduled resolution")

@router.get("/providers", summary="List Available LLM Providers")
@router.get("/provider", summary="List Available LLM Providers (Alias)")
async def list_llm_providers():
    """
    Returns the status of all configured LLM providers (Ollama, OpenRouter, Gemini, Heuristic).
    """
    active_llm = get_llm_provider()
    return {
        "active_provider": active_llm.name,
        "configured_default": settings.AI_PROVIDER,
        "ollama": {
            "base_url": settings.OLLAMA_BASE_URL,
            "text_model": settings.OLLAMA_TEXT_MODEL,
        },
        "openrouter": {
            "base_url": getattr(settings, "OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
            "model": getattr(settings, "OPENROUTER_MODEL", "meta-llama/llama-3.2-3b-instruct:free"),
            "key_configured": bool(getattr(settings, "OPENROUTER_API_KEY", "")),
        },
        "heuristic_fallback": "Available (Zero-network 100% uptime)",
    }

def _execute_agent(target_id: str, limit_steps: int):
    try:
        agent = get_grievance_agent()
        state = agent.run(target_id, max_steps=limit_steps or 6)
        return {
            "success": True,
            "grievance_id": target_id,
            "status": state.get("status"),
            "authority_id": state.get("authority_id"),
            "escalation_level": state.get("escalation_level", 0),
            "completed": state.get("completed", False),
            "next_step": state.get("next_step"),
            "state": state,
        }
    except Exception as e:
        logger.error(f"Error running agent for {target_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Agent execution error: {str(e)}")

@router.get("/run", summary="Run Grievance Agent Lifecycle (GET)")
def run_agent_get(
    grievance_id: Optional[str] = Query("GRV-2026-1042", description="Grievance ID for GET requests"),
    max_steps: int = Query(6, ge=1, le=20, description="Max node steps to run")
):
    """
    Runs the LangGraph agent for a grievance via GET (convenient for browser testing).
    """
    return _execute_agent(grievance_id or "GRV-2026-1042", max_steps)

@router.post("/run", summary="Run Grievance Agent Lifecycle (POST)")
def run_agent_post(req: RunAgentRequest):
    """
    Runs the LangGraph agent for a grievance via POST with JSON body.
    """
    return _execute_agent(req.grievance_id, req.max_steps or 6)

@router.post("/step", summary="Advance Single Agent Step")
def step_agent(req: StepAgentRequest):
    """
    Executes a single atomic transition in the agent's state machine.
    """
    try:
        agent = get_grievance_agent()
        state = agent.step(req.grievance_id)
        return {
            "success": True,
            "grievance_id": req.grievance_id,
            "current_step": state.get("next_step"),
            "status": state.get("status"),
            "state": state,
        }
    except Exception as e:
        logger.error(f"Error stepping agent for {req.grievance_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Agent step error: {str(e)}")

@router.get("/state/{grievance_id}", summary="Get Persistent Agent State")
def get_agent_state(grievance_id: str):
    """
    Returns the full persistent LangGraph state for a given grievance.
    """
    agent = get_grievance_agent()
    state = agent.get_state(grievance_id)
    return {
        "success": True,
        "grievance_id": grievance_id,
        "state": state,
    }

@router.get("/history/{grievance_id}", summary="Get Agent Execution History")
def get_agent_history(grievance_id: str):
    """
    Returns the chronological audit logs and tool calls executed by the agent.
    """
    agent = get_grievance_agent()
    state = agent.get_state(grievance_id)
    return {
        "success": True,
        "grievance_id": grievance_id,
        "logs": state.get("logs", []),
    }

@router.post("/simulate-response", summary="Simulate Authority Response & Advance Agent")
def simulate_authority_response(req: SimulateAuthorityResponseRequest):
    """
    Simulates an inbound authority directive or resolution to test the cyclical agent response flow.
    """
    agent = get_grievance_agent()
    # Update status via agent tools
    agent.tools.update_grievance_status(
        grievance_id=req.grievance_id,
        status=req.action_type,
        directive=req.directive,
        expected_resolution_at=req.expected_resolution_at
    )
    
    # Run the agent to process the new response
    state = agent.run(req.grievance_id, max_steps=4)
    return {
        "success": True,
        "message": f"Authority response simulated. Grievance transitioned to {state.get('status')}.",
        "state": state,
    }
