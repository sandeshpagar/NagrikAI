from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from datetime import datetime

class EscalationTierInfo(BaseModel):
    """
    Representation of an authority tier in a statutory escalation chain.
    """
    tier: int = Field(..., ge=1, le=4, description="Tier index in the ladder (1=Field, 2=Zonal, 3=Apex)")
    role: str = Field(..., description="Role key: FIELD_OFFICER, DEPARTMENT_ADMIN, SYSTEM_ADMIN")
    name: str = Field(..., description="Full name and title of the escalation authority officer")
    designation: str = Field(..., description="Official government rank / post")
    email: str = Field(..., description="Official government notification email")
    phone: str = Field(..., description="Official escalation contact phone")
    trigger_condition: str = Field(..., description="Condition under which this tier is invoked")
    sla_threshold_hours: Optional[int] = Field(None, description="Statutory threshold hours for this tier")

class EscalationEvent(BaseModel):
    """
    Audit-grade record of an escalation event under Section 65B standards.
    """
    id: str = Field(..., description="Unique event UUID e.g. ESC-2026-9182")
    grievance_id: str = Field(..., description="ID of the grievance escalated")
    from_level: int = Field(0, description="Previous escalation tier level")
    to_level: int = Field(1, description="New escalation tier level")
    from_authority: Optional[Dict[str, Any]] = None
    to_authority: Dict[str, Any]
    trigger_reason: str
    breached_hours: Optional[float] = None
    actor_type: str = "SYSTEM"
    actor_name: str = "NagrikAI Statutory Escalation Engine"
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")

class TriggerEscalationRequest(BaseModel):
    """
    Request schema to trigger an escalation on demand or via automation.
    """
    grievance_id: str = Field(..., description="Civic grievance ticket or ID")
    target_level: Optional[int] = Field(None, description="Specific tier level to escalate to (or next level if None)")
    reason: str = Field(..., description="Justification or statutory breach reason for escalation")
    actor_type: Optional[str] = Field("ADMIN", description="SYSTEM, AI_AGENT, OFFICER, or ADMIN")
    actor_name: Optional[str] = Field("Municipal Administrator", description="Name of the triggering actor")
