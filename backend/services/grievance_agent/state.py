from typing import Optional, Dict, Any, List
from typing_extensions import TypedDict
from datetime import datetime

class GrievanceAgentState(TypedDict, total=False):
    """
    Persistent LangGraph state representation for a single civic grievance.
    Directly satisfies Phase 12 specifications with statutory RTSA 2015 tracking.
    """
    grievance_id: str                      # Unique identifier (e.g. GRV-2026-1042)
    authority_id: Optional[str]            # Designated municipal officer/department ID
    status: str                            # SUBMITTED | ASSIGNED | ACTION_SCHEDULED | RESOLVED | ESCALATED | CLOSED
    last_response: Optional[str]           # Latest validated response from authority or citizen
    last_followup_at: Optional[str]        # Timestamp of last reminder sent
    followup_count: int                    # Number of follow-ups dispatched (max 3 before escalation)
    sla_deadline: Optional[str]            # Statutory deadline under RTSA 2015
    expected_resolution_at: Optional[str]  # Officer-committed resolution time
    escalation_level: int                  # 0 (Ward Officer) -> 1 (Dept Admin) -> 2 (Municipal Commissioner)
    
    # Contextual metadata
    title: Optional[str]
    description: Optional[str]
    category: Optional[str]
    priority: Optional[str]
    ward: Optional[str]
    citizen_name: Optional[str]
    citizen_phone: Optional[str]
    evidence_status: str                   # VALIDATED | INSUFFICIENT | REQUESTED
    
    # Execution tracing
    next_step: Optional[str]
    completed: bool
    logs: List[Dict[str, Any]]             # Historical step trajectory
    error: Optional[str]

def create_initial_agent_state(
    grievance_id: str,
    grievance_data: Optional[Dict[str, Any]] = None
) -> GrievanceAgentState:
    """Factory helper to build a consistent initial state."""
    data = grievance_data or {}
    now_iso = datetime.utcnow().isoformat()

    return GrievanceAgentState(
        grievance_id=grievance_id,
        authority_id=data.get("assigned_authority_id"),
        status=data.get("status", "SUBMITTED"),
        last_response=data.get("authority_directive"),
        last_followup_at=None,
        followup_count=0,
        sla_deadline=data.get("sla_deadline_iso"),
        expected_resolution_at=data.get("expected_resolution_at"),
        escalation_level=data.get("escalation_level", 0),
        title=data.get("title", "Civic Grievance"),
        description=data.get("description", ""),
        category=data.get("category", "Road Infrastructure & Public Safety"),
        priority=data.get("priority", "HIGH"),
        ward=data.get("ward", "Ward 12 - Sinhagad Zone"),
        citizen_name=data.get("citizen_name", "Citizen Resident"),
        citizen_phone=data.get("citizen_phone", "+91 98220 54199"),
        evidence_status=data.get("evidence_status", "VALIDATED"),
        next_step="INSPECT_STATE",
        completed=False,
        logs=[{
            "timestamp": now_iso,
            "action": "AGENT_INITIALIZED",
            "details": f"Persistent LangGraph agent initialized for grievance {grievance_id}."
        }],
        error=None,
    )
