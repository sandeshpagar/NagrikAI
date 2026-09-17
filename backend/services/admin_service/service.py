"""
NagrikAI Admin & Governance Service (Phase 17)
Provides stateful management of:
- PMC Departments
- Officers Directory
- Jurisdictions / Wards
- Escalation Policies
- Global System Settings
Seeds official Pune Municipal Corporation administrative benchmarks with audit ledger integration.
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from services.supabase_client import get_supabase
from services.audit import record_audit_event
from services.admin_service.models import (
    DepartmentModel,
    DepartmentCreate,
    DepartmentUpdate,
    AuthorityOfficerModel,
    OfficerCreate,
    OfficerUpdate,
    JurisdictionWardModel,
    JurisdictionCreate,
    EscalationPolicyModel,
    EscalationPolicyCreate,
    SystemSettingsModel,
    SystemSettingsUpdate,
    AdminOverviewResponse,
)

logger = logging.getLogger("nagrikai.admin_service")


class AdminGovernanceService:
    _instance: Optional["AdminGovernanceService"] = None

    def __new__(cls) -> "AdminGovernanceService":
        if cls._instance is None:
            cls._instance = super(AdminGovernanceService, cls).__new__(cls)
            cls._instance._init_defaults()
        return cls._instance

    def _init_defaults(self):
        """Initializes default PMC municipal administration matrix."""
        self._departments: Dict[str, DepartmentModel] = {
            "PMC-CIVIL": DepartmentModel(
                id="dept-1111-pmc-civil",
                code="PMC-CIVIL",
                name="PMC Road Infrastructure Division",
                description="Statutory maintenance of city arterial roads, asphalt patching, bridges, and flyovers.",
                head_officer="Er. Sanjay V. Kulkarni (Chief Engineer)",
                contact_email="roads.pmc@punecorporation.org",
                contact_phone="+91-20-25501101",
                is_active=True,
                total_officers=18,
                active_cases=42
            ),
            "PMC-SWM": DepartmentModel(
                id="dept-2222-pmc-swm",
                code="PMC-SWM",
                name="Solid Waste Management Dept",
                description="City-wide municipal garbage collection, compactor vehicle dispatch, and landfill management.",
                head_officer="Dr. Ketan K. Deshpande (Joint Municipal Commissioner)",
                contact_email="swm.pmc@punecorporation.org",
                contact_phone="+91-20-25501102",
                is_active=True,
                total_officers=24,
                active_cases=28
            ),
            "PMC-WATER": DepartmentModel(
                id="dept-3333-pmc-water",
                code="PMC-WATER",
                name="Water Supply & Sewerage Board",
                description="Potable water mains, pressure regulator stations, canal pipelines, and sewer unblocking.",
                head_officer="Er. Nandkishore Jagtap (Superintending Engineer)",
                contact_email="water.pmc@punecorporation.org",
                contact_phone="+91-20-25501103",
                is_active=True,
                total_officers=15,
                active_cases=19
            ),
            "PMC-ELEC": DepartmentModel(
                id="dept-4444-pmc-elec",
                code="PMC-ELEC",
                name="Electrical & Public Lighting Dept",
                description="High-mast LED streetlighting, exposed cable insulated conduits, and feeder pillars.",
                head_officer="Er. Manisha Shekatkar (Executive Engineer)",
                contact_email="electrical.pmc@punecorporation.org",
                contact_phone="+91-20-25501104",
                is_active=True,
                total_officers=12,
                active_cases=9
            ),
        }

        self._officers: Dict[str, AuthorityOfficerModel] = {
            "off-01": AuthorityOfficerModel(
                id="off-01",
                name="Er. Ramesh Deshmukh",
                designation="Junior Engineer (Roads)",
                tier="TIER_1_JE",
                department_code="PMC-CIVIL",
                assigned_ward="Ward 12",
                email="ramesh.deshmukh@punecorporation.org",
                phone="+91-9822011001",
                is_on_duty=True,
                resolved_count=142,
                sla_compliance_rate=94.5
            ),
            "off-02": AuthorityOfficerModel(
                id="off-02",
                name="Er. Sunil Patil",
                designation="Executive Engineer (Sinhagad Division)",
                tier="TIER_2_EE",
                department_code="PMC-CIVIL",
                assigned_ward="Ward 12",
                email="sunil.patil@punecorporation.org",
                phone="+91-9822011002",
                is_on_duty=True,
                resolved_count=210,
                sla_compliance_rate=96.0
            ),
            "off-03": AuthorityOfficerModel(
                id="off-03",
                name="Dr. Anita Joshi",
                designation="Divisional Sanitation Inspector",
                tier="TIER_1_JE",
                department_code="PMC-SWM",
                assigned_ward="Ward 8",
                email="anita.joshi@punecorporation.org",
                phone="+91-9822011003",
                is_on_duty=True,
                resolved_count=98,
                sla_compliance_rate=97.2
            ),
            "off-04": AuthorityOfficerModel(
                id="off-04",
                name="Er. Pradeep Shinde",
                designation="Junior Engineer (Water Distribution)",
                tier="TIER_1_JE",
                department_code="PMC-WATER",
                assigned_ward="Ward 10",
                email="pradeep.shinde@punecorporation.org",
                phone="+91-9822011004",
                is_on_duty=True,
                resolved_count=84,
                sla_compliance_rate=93.8
            ),
            "off-05": AuthorityOfficerModel(
                id="off-05",
                name="Shri Ravindra Binwade, IAS",
                designation="Additional Municipal Commissioner (General)",
                tier="TIER_3_AMC",
                department_code="PMC-APEX",
                assigned_ward="ALL_PMC_WARDS",
                email="amc.general@punecorporation.org",
                phone="+91-20-25501002",
                is_on_duty=True,
                resolved_count=45,
                sla_compliance_rate=99.1
            ),
        }

        self._jurisdictions: Dict[str, JurisdictionWardModel] = {
            "ward-12": JurisdictionWardModel(
                id="ward-12",
                ward_number=12,
                name="Sinhagad Road / Dhayari / Vadgaon",
                zone="Zone 4 (South Pune)",
                office_address="PMC Ward 12 Office, Near Pu La Deshpande Garden, Sinhagad Road, Pune 411030",
                lead_officer_id="off-02",
                pincodes=["411041", "411051", "411030"],
                is_active=True,
                active_grievances=42
            ),
            "ward-10": JurisdictionWardModel(
                id="ward-10",
                ward_number=10,
                name="Kothrud / Karve Road",
                zone="Zone 3 (West Pune)",
                office_address="PMC Kothrud Ward Office, Dahanukar Colony, Kothrud, Pune 411038",
                lead_officer_id="off-04",
                pincodes=["411038", "411029", "411058"],
                is_active=True,
                active_grievances=19
            ),
            "ward-8": JurisdictionWardModel(
                id="ward-8",
                ward_number=8,
                name="Shaniwar Peth / Deccan Gymkhana",
                zone="Zone 1 (Central Pune)",
                office_address="PMC Central Ward Office, Bajirao Road, Shaniwar Peth, Pune 411030",
                lead_officer_id="off-03",
                pincodes=["411004", "411030", "411002"],
                is_active=True,
                active_grievances=28
            ),
            "ward-4": JurisdictionWardModel(
                id="ward-4",
                ward_number=4,
                name="Shivajinagar / Ghole Road",
                zone="Zone 2 (North Pune)",
                office_address="PMC Shivajinagar Ward Office, Ghole Road, Pune 411005",
                lead_officer_id=None,
                pincodes=["411005", "411016", "411007"],
                is_active=True,
                active_grievances=9
            ),
        }

        self._escalation_policies: Dict[str, EscalationPolicyModel] = {
            "POL-CIVIL-CRIT": EscalationPolicyModel(
                id="pol-civil-crit",
                department_code="PMC-CIVIL",
                priority="CRITICAL",
                tier1_role="Junior Engineer (Roads)",
                tier1_sla_hours=4,
                tier2_role="Executive Engineer (Sinhagad Division)",
                tier2_sla_hours=12,
                tier3_role="Additional Municipal Commissioner (Apex HQ)",
                tier3_sla_hours=24,
                auto_escalate_on_breach=True,
                is_active=True
            ),
            "POL-CIVIL-STD": EscalationPolicyModel(
                id="pol-civil-std",
                department_code="PMC-CIVIL",
                priority="MEDIUM",
                tier1_role="Junior Engineer (Roads)",
                tier1_sla_hours=24,
                tier2_role="Executive Engineer (Sinhagad Division)",
                tier2_sla_hours=48,
                tier3_role="Additional Municipal Commissioner (Apex HQ)",
                tier3_sla_hours=72,
                auto_escalate_on_breach=True,
                is_active=True
            ),
            "POL-SWM-STD": EscalationPolicyModel(
                id="pol-swm-std",
                department_code="PMC-SWM",
                priority="HIGH",
                tier1_role="Divisional Sanitation Inspector",
                tier1_sla_hours=12,
                tier2_role="Deputy Health Officer (SWM)",
                tier2_sla_hours=24,
                tier3_role="Joint Municipal Commissioner",
                tier3_sla_hours=48,
                auto_escalate_on_breach=True,
                is_active=True
            ),
        }

        self._settings = SystemSettingsModel()

    # --- Department Management ---
    def get_departments(self) -> List[DepartmentModel]:
        return list(self._departments.values())

    def create_department(self, payload: DepartmentCreate) -> DepartmentModel:
        dept_id = f"dept-{uuid.uuid4().hex[:8]}"
        dept = DepartmentModel(
            id=dept_id,
            code=payload.code.upper(),
            name=payload.name,
            description=payload.description,
            head_officer=payload.head_officer,
            contact_email=payload.contact_email,
            contact_phone=payload.contact_phone,
            is_active=payload.is_active,
            total_officers=0,
            active_cases=0
        )
        self._departments[dept.code] = dept
        record_audit_event(
            action_type="ADMIN_DEPARTMENT_CREATED",
            actor_type="ADMIN",
            actor_id="admin-sys",
            details={"code": dept.code, "name": dept.name}
        )
        return dept

    def update_department(self, code: str, payload: DepartmentUpdate) -> Optional[DepartmentModel]:
        code = code.upper()
        if code not in self._departments:
            return None
        current = self._departments[code]
        updated = current.copy(update=payload.dict(exclude_unset=True))
        self._departments[code] = updated
        record_audit_event(
            action_type="ADMIN_DEPARTMENT_UPDATED",
            actor_type="ADMIN",
            actor_id="admin-sys",
            details={"code": code, "changes": payload.dict(exclude_unset=True)}
        )
        return updated

    def delete_department(self, code: str) -> bool:
        code = code.upper()
        if code in self._departments:
            deleted = self._departments.pop(code)
            record_audit_event(
                action_type="ADMIN_DEPARTMENT_DELETED",
                actor_type="ADMIN",
                actor_id="admin-sys",
                details={"code": code, "name": deleted.name}
            )
            return True
        return False

    # --- Officer Management ---
    def get_officers(self) -> List[AuthorityOfficerModel]:
        return list(self._officers.values())

    def create_officer(self, payload: OfficerCreate) -> AuthorityOfficerModel:
        off_id = f"off-{uuid.uuid4().hex[:6]}"
        officer = AuthorityOfficerModel(
            id=off_id,
            name=payload.name,
            designation=payload.designation,
            tier=payload.tier,
            department_code=payload.department_code.upper(),
            assigned_ward=payload.assigned_ward,
            email=payload.email,
            phone=payload.phone,
            is_on_duty=payload.is_on_duty,
            resolved_count=0,
            sla_compliance_rate=100.0
        )
        self._officers[off_id] = officer
        record_audit_event(
            action_type="ADMIN_OFFICER_CREATED",
            actor_type="ADMIN",
            actor_id="admin-sys",
            details={"officer_id": off_id, "name": officer.name, "ward": officer.assigned_ward}
        )
        return officer

    def update_officer(self, officer_id: str, payload: OfficerUpdate) -> Optional[AuthorityOfficerModel]:
        if officer_id not in self._officers:
            return None
        current = self._officers[officer_id]
        updated = current.copy(update=payload.dict(exclude_unset=True))
        self._officers[officer_id] = updated
        record_audit_event(
            action_type="ADMIN_OFFICER_UPDATED",
            actor_type="ADMIN",
            actor_id="admin-sys",
            details={"officer_id": officer_id, "changes": payload.dict(exclude_unset=True)}
        )
        return updated

    def delete_officer(self, officer_id: str) -> bool:
        if officer_id in self._officers:
            deleted = self._officers.pop(officer_id)
            record_audit_event(
                action_type="ADMIN_OFFICER_DELETED",
                actor_type="ADMIN",
                actor_id="admin-sys",
                details={"officer_id": officer_id, "name": deleted.name}
            )
            return True
        return False

    # --- Jurisdiction Management ---
    def get_jurisdictions(self) -> List[JurisdictionWardModel]:
        return list(self._jurisdictions.values())

    def create_jurisdiction(self, payload: JurisdictionCreate) -> JurisdictionWardModel:
        ward_id = f"ward-{payload.ward_number}"
        ward = JurisdictionWardModel(
            id=ward_id,
            ward_number=payload.ward_number,
            name=payload.name,
            zone=payload.zone,
            office_address=payload.office_address,
            lead_officer_id=payload.lead_officer_id,
            pincodes=payload.pincodes,
            is_active=payload.is_active,
            active_grievances=0
        )
        self._jurisdictions[ward_id] = ward
        record_audit_event(
            action_type="ADMIN_JURISDICTION_CREATED",
            actor_type="ADMIN",
            actor_id="admin-sys",
            details={"ward": payload.ward_number, "name": payload.name}
        )
        return ward

    # --- Escalation Policies ---
    def get_escalation_policies(self) -> List[EscalationPolicyModel]:
        return list(self._escalation_policies.values())

    def create_escalation_policy(self, payload: EscalationPolicyCreate) -> EscalationPolicyModel:
        pol_id = f"pol-{uuid.uuid4().hex[:6]}"
        policy = EscalationPolicyModel(
            id=pol_id,
            department_code=payload.department_code.upper(),
            priority=payload.priority.upper(),
            tier1_role=payload.tier1_role,
            tier1_sla_hours=payload.tier1_sla_hours,
            tier2_role=payload.tier2_role,
            tier2_sla_hours=payload.tier2_sla_hours,
            tier3_role=payload.tier3_role,
            tier3_sla_hours=payload.tier3_sla_hours,
            auto_escalate_on_breach=payload.auto_escalate_on_breach,
            is_active=payload.is_active
        )
        self._escalation_policies[pol_id] = policy
        record_audit_event(
            action_type="ADMIN_ESCALATION_POLICY_CREATED",
            actor_type="ADMIN",
            actor_id="admin-sys",
            details={"policy_id": pol_id, "dept": policy.department_code, "priority": policy.priority}
        )
        return policy

    # --- System Settings ---
    def get_settings(self) -> SystemSettingsModel:
        return self._settings

    def update_settings(self, payload: SystemSettingsUpdate) -> SystemSettingsModel:
        updated = self._settings.copy(update=payload.dict(exclude_unset=True))
        self._settings = updated
        record_audit_event(
            action_type="ADMIN_SETTINGS_UPDATED",
            actor_type="ADMIN",
            actor_id="admin-sys",
            details=payload.dict(exclude_unset=True)
        )
        return self._settings

    # --- Overview ---
    def get_overview(self) -> AdminOverviewResponse:
        supabase = get_supabase()
        db_status = "connected" if supabase is not None else "simulated_local"
        
        return AdminOverviewResponse(
            total_departments=len(self._departments),
            active_officers=sum(1 for o in self._officers.values() if o.is_on_duty),
            total_jurisdictions=len(self._jurisdictions),
            active_sla_rules=8,
            active_escalation_policies=len(self._escalation_policies),
            system_settings=self._settings,
            db_status=db_status,
            llm_status="operational",
            last_audit_timestamp=datetime.now(timezone.utc).isoformat()
        )


admin_service = AdminGovernanceService()
