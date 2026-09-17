from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from datetime import datetime

class SlaRule(BaseModel):
    """
    Configurable statutory SLA rule defining acknowledgement and resolution timelines.
    Compliant with the Maharashtra Right to Public Services Act (RTSA 2015).
    """
    rule_id: str = Field(..., description="Unique rule identifier e.g. SLA-PMC-CIVIL-HIGH")
    department_code: Optional[str] = Field(None, description="Department code filter e.g. PMC-CIVIL")
    category: Optional[str] = Field(None, description="Category filter e.g. Road Infrastructure, Potholes")
    priority: Optional[str] = Field(None, description="Priority filter: CRITICAL, HIGH, MEDIUM, LOW")
    acknowledgement_hours: int = Field(..., description="Hours allowed before officer initial intake / acknowledgement")
    resolution_hours: int = Field(..., description="Statutory hours allowed for full resolution")
    reminder_before_hours: int = Field(2, description="Hours before resolution deadline to send pre-deadline reminder")
    reminder_after_hours: int = Field(4, description="Hours interval after missed deadline for follow-ups")
    escalation_after_hours: int = Field(4, description="Hours of breach or non-response before triggering statutory escalation")
    max_reminders: int = Field(3, description="Maximum reminders dispatched before escalating to next tier")
    is_active: bool = Field(True, description="Whether rule is actively applied")
    description: Optional[str] = Field(None, description="Human-readable description of statutory mandate")

class SlaRuleCreate(BaseModel):
    rule_id: Optional[str] = None
    department_code: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    acknowledgement_hours: int
    resolution_hours: int
    reminder_before_hours: int = 2
    reminder_after_hours: int = 4
    escalation_after_hours: int = 4
    max_reminders: int = 3
    is_active: bool = True
    description: Optional[str] = None

class SlaRuleUpdate(BaseModel):
    acknowledgement_hours: Optional[int] = None
    resolution_hours: Optional[int] = None
    reminder_before_hours: Optional[int] = None
    reminder_after_hours: Optional[int] = None
    escalation_after_hours: Optional[int] = None
    max_reminders: Optional[int] = None
    is_active: Optional[bool] = None
    description: Optional[str] = None

class SlaEvaluationResult(BaseModel):
    """
    Real-time computed evaluation of a grievance's SLA status and deadlines.
    """
    grievance_id: str
    priority: str
    department: Optional[str] = None
    category: Optional[str] = None
    created_at: str
    
    # Acknowledgement SLA
    acknowledgement_deadline: Optional[str] = None
    acknowledgement_status: str = Field("PENDING", description="MET, PENDING, or BREACHED")
    acknowledged_at: Optional[str] = None
    
    # Resolution SLA
    resolution_deadline: Optional[str] = None
    resolution_status: str = Field("PENDING", description="MET, PENDING, BREACHED, or OVERDUE")
    resolved_at: Optional[str] = None
    
    # Time metrics
    elapsed_seconds: int = 0
    time_remaining_seconds: int = 0
    time_remaining_formatted: str = Field("0h 00m", description="Human-readable remaining time e.g. '4h 15m remaining' or '2h 10m overdue'")
    is_overdue: bool = False
    
    # Urgency & Recommended Actions
    urgency_level: str = Field("NORMAL", description="NORMAL, WARNING_SOON, BREACHED, or CRITICAL_ESCALATION")
    reminder_recommended: bool = False
    escalation_recommended: bool = False
    escalation_reason: Optional[str] = None
    
    # Hierarchy & Metadata
    current_escalation_tier: int = 0
    followup_count: int = 0
    applicable_rule_id: str = "DEFAULT-RTSA-2015"
    evaluated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
