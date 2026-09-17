from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime

class AuthorityContact(BaseModel):
    """
    Direct official contact representation for a municipal authority.
    """
    id: str = Field(..., description="Unique UUID or identifier for the authority officer")
    name: str = Field(..., description="Full name and title of the assigned officer")
    designation: str = Field(..., description="Official administrative post/designation")
    email: str = Field(..., description="Statutory official government email address")
    phone: str = Field(..., description="Official direct communication desk/mobile number")
    office_address: str = Field(..., description="Physical divisional/ward municipal headquarters")
    department_name: Optional[str] = Field(None, description="Department name")
    department_code: Optional[str] = Field(None, description="Department code e.g. PMC-CIVIL")
    jurisdiction_name: Optional[str] = Field(None, description="Ward or municipal zone name")

    @property
    def department(self) -> str:
        return self.department_name or ""

    @property
    def jurisdiction(self) -> str:
        return self.jurisdiction_name or ""

class EscalationTier(BaseModel):
    """
    Individual tier within the statutory 3-tier escalation ladder.
    """
    tier: int = Field(..., ge=1, le=3, description="Tier index (1=Field, 2=Zonal Admin, 3=Apex)")
    role: str = Field(..., description="System civic role identifier (FIELD_OFFICER, DEPARTMENT_ADMIN, SYSTEM_ADMIN)")
    name: str = Field(..., description="Official name of the escalation authority")
    designation: str = Field(..., description="Designation / Rank of the escalation officer")
    email: str = Field(..., description="Official government notification email")
    phone: str = Field(..., description="Official escalation contact phone")
    trigger_condition: str = Field(..., description="Statutory event triggering this escalation tier")
    sla_threshold_hours: Optional[int] = Field(None, description="SLA hours before escalation trigger")

class AuthorityResolutionInput(BaseModel):
    """
    Input parameters to resolve municipal authority and escalation hierarchy.
    """
    jurisdiction: Optional[str] = Field(None, description="Ward name, zone, or location string")
    category: Optional[str] = Field(None, description="Grievance primary domain category")
    department: Optional[str] = Field(None, description="Specific municipal department if pre-assigned")
    grievance_id: Optional[str] = Field(None, description="Supabase UUID of existing grievance")
    grievance_number: Optional[str] = Field(None, description="Civic tracking number e.g. GRV-2026-1042")

class AuthorityResolutionOutput(BaseModel):
    """
    Complete resolved output contract matching Phase 8 specification.
    """
    jurisdiction: str
    category: str
    department: str
    responsible_authority: AuthorityContact
    escalation_chain: List[EscalationTier]
    is_fallback: bool = Field(False, description="True if mapped via fallback due to missing rule")
    mapping_rule_id: str = Field(..., description="Unique mapping rule reference identifier")
    resolution_timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")

    @property
    def authority(self) -> AuthorityContact:
        return self.responsible_authority

class BaseAuthorityMapper(ABC):
    """
    Abstract contract for Authority Mapping Engines.
    """
    @abstractmethod
    def resolve(self, req: AuthorityResolutionInput) -> AuthorityResolutionOutput:
        """
        Resolves authority and escalation chain from 3-tuple (jurisdiction, category, department).
        """
        pass
