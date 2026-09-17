from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from datetime import datetime

class OfficerActionSubmission(BaseModel):
    """
    Input contract for an authority officer interacting with a grievance case.
    Supports directives, status updates, scheduling, resolution notes, and SOP modifications.
    """
    grievance_id: str = Field(..., description="Unique grievance ticket or ID")
    officer_id: Optional[str] = Field(None, description="Officer UUID or identifier")
    officer_name: Optional[str] = Field(None, description="Name and designation of officer")
    directive_text: Optional[str] = Field(None, description="Official operational directive or instruction text")
    status_intent: Optional[str] = Field(None, description="IN_PROGRESS, ACTION_SCHEDULED, RESOLVED, NEEDS_EVIDENCE, REJECTED")
    expected_action_date: Optional[str] = Field(None, description="Committed ISO timestamp for resolution or inspection")
    resolution_notes: Optional[str] = Field(None, description="Formal closure notes, contractor IDs, or completion proof")
    confirm_ai_sop: Optional[bool] = Field(False, description="True if officer confirms AI recommended SOP")
    modified_sop_action: Optional[str] = Field(None, description="Custom action text if officer modified AI SOP")
    modification_reason: Optional[str] = Field(None, description="Justification for modifying AI SOP")

class ValidatedOfficerResponse(BaseModel):
    """
    Validated, unambiguous structured interpretation of an officer action.
    Compliant with strict zero-fabrication guardrails under RTSA 2015.
    """
    grievance_id: str
    status: str = Field(..., description="Validated state: IN_PROGRESS, ACTION_SCHEDULED, RESOLVED, NEEDS_EVIDENCE, REJECTED, or unchanged")
    is_ambiguous: bool = Field(False, description="True if directive is vague, conflicting, or non-committal")
    confidence: float = Field(1.0, ge=0.0, le=1.0, description="Confidence score of interpretation")
    clarification_requested: Optional[str] = Field(None, description="Clarification prompt if directive is ambiguous")
    expected_resolution_at: Optional[str] = Field(None, description="Validated committed date for resolution")
    plain_language_summary: str = Field(..., description="Citizen-safe plain English reassurance update")
    recommendation_decision: str = Field("UNCHANGED", description="CONFIRMED, MODIFIED, REJECTED, or UNCHANGED")
    resolution_notes: Optional[str] = None
    applied_directive: Optional[str] = None
    processed_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")

class ConfirmRecommendationRequest(BaseModel):
    grievance_id: str
    officer_id: Optional[str] = None
    officer_name: Optional[str] = "Authority Officer"
    notes: Optional[str] = None

class ModifyRecommendationRequest(BaseModel):
    grievance_id: str
    custom_action: str = Field(..., min_length=5, description="Custom municipal action plan")
    reason: str = Field(..., min_length=5, description="Administrative reasoning for modification")
    officer_id: Optional[str] = None
    officer_name: Optional[str] = "Authority Officer"
