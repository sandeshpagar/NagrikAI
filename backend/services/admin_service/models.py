"""
NagrikAI Admin Service Data Models (Phase 17)
Defines structured schemas for:
- Department Management
- Authority & Officer Management
- Jurisdiction & Ward Management
- SLA & Escalation Policy Configuration
- System Settings & Feature Flags
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# 1. Department Models
class DepartmentModel(BaseModel):
    id: str
    code: str
    name: str
    description: Optional[str] = None
    head_officer: str
    contact_email: str
    contact_phone: str
    is_active: bool = True
    total_officers: int = 0
    active_cases: int = 0


class DepartmentCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    head_officer: str
    contact_email: str
    contact_phone: str
    is_active: bool = True


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    head_officer: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    is_active: Optional[bool] = None


# 2. Authority Officer Models
class AuthorityOfficerModel(BaseModel):
    id: str
    name: str
    designation: str
    tier: str  # TIER_1_JE, TIER_2_EE, TIER_3_AMC
    department_code: str
    assigned_ward: str
    email: str
    phone: str
    is_on_duty: bool = True
    resolved_count: int = 0
    sla_compliance_rate: float = 95.0


class OfficerCreate(BaseModel):
    name: str
    designation: str
    tier: str = "TIER_1_JE"
    department_code: str
    assigned_ward: str
    email: str
    phone: str
    is_on_duty: bool = True


class OfficerUpdate(BaseModel):
    name: Optional[str] = None
    designation: Optional[str] = None
    tier: Optional[str] = None
    department_code: Optional[str] = None
    assigned_ward: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    is_on_duty: Optional[bool] = None


# 3. Jurisdiction & Ward Models
class JurisdictionWardModel(BaseModel):
    id: str
    ward_number: int
    name: str
    zone: str
    office_address: str
    lead_officer_id: Optional[str] = None
    pincodes: List[str] = Field(default_factory=list)
    is_active: bool = True
    active_grievances: int = 0


class JurisdictionCreate(BaseModel):
    ward_number: int
    name: str
    zone: str
    office_address: str
    lead_officer_id: Optional[str] = None
    pincodes: List[str] = Field(default_factory=list)
    is_active: bool = True


# 4. Escalation Policy Models
class EscalationPolicyModel(BaseModel):
    id: str
    department_code: str
    priority: str
    tier1_role: str
    tier1_sla_hours: int
    tier2_role: str
    tier2_sla_hours: int
    tier3_role: str
    tier3_sla_hours: int
    auto_escalate_on_breach: bool = True
    is_active: bool = True


class EscalationPolicyCreate(BaseModel):
    department_code: str
    priority: str
    tier1_role: str = "Junior Engineer (Ward Field Desk)"
    tier1_sla_hours: int = 24
    tier2_role: str = "Executive Engineer (Zonal Division)"
    tier2_sla_hours: int = 48
    tier3_role: str = "Additional Municipal Commissioner (Apex HQ)"
    tier3_sla_hours: int = 72
    auto_escalate_on_breach: bool = True
    is_active: bool = True


# 5. System Settings & Flags
class SystemSettingsModel(BaseModel):
    platform_name: str = "NagrikAI Pune Civic Platform"
    environment: str = "Production-Simulated"
    ai_primary_model: str = "gemini-2.5-flash"
    ai_fallback_model: str = "heuristic-rules-engine"
    autonomous_agent_interval_seconds: int = 300
    statutory_rtsa_strict_mode: bool = True
    telephony_voice_agent_enabled: bool = False
    citizen_notifications_enabled: bool = True
    maintenance_mode: bool = False
    audit_immutable_ledger_active: bool = True


class SystemSettingsUpdate(BaseModel):
    platform_name: Optional[str] = None
    ai_primary_model: Optional[str] = None
    ai_fallback_model: Optional[str] = None
    autonomous_agent_interval_seconds: Optional[int] = None
    statutory_rtsa_strict_mode: Optional[bool] = None
    telephony_voice_agent_enabled: Optional[bool] = None
    citizen_notifications_enabled: Optional[bool] = None
    maintenance_mode: Optional[bool] = None


# 6. Admin Overview Response
class AdminOverviewResponse(BaseModel):
    total_departments: int
    active_officers: int
    total_jurisdictions: int
    active_sla_rules: int
    active_escalation_policies: int
    system_settings: SystemSettingsModel
    db_status: str
    llm_status: str
    last_audit_timestamp: str
