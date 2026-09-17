"""
NagrikAI Analytics Engine Data Models (Phase 16)
Defines structured response models for all 10 analytical dimensions:
1. Category Breakdown
2. Department Breakdown
3. Area / Ward Breakdown
4. Resolution Time Metrics
5. SLA Compliance Metrics
6. Escalation Tiers Breakdown
7. Recurring Hazard Clusters
8. Evidence Forensic Outcomes
9. AI Recommendation Alignment
10. LangGraph Agent Activity
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class MetricCard(BaseModel):
    label: str
    value: str
    numeric_value: float
    trend: str
    is_positive: bool
    subtext: str


class DistributionItem(BaseModel):
    name: str
    count: int
    percentage: float
    color: Optional[str] = None
    sla_compliance_pct: Optional[float] = None
    avg_hours: Optional[float] = None


class CategoryBreakdown(BaseModel):
    categories: List[DistributionItem]
    top_category: str
    total_complaints: int


class DepartmentBreakdown(BaseModel):
    departments: List[DistributionItem]
    top_department: str
    fastest_department: str


class WardBreakdown(BaseModel):
    wards: List[DistributionItem]
    hotspot_ward: str
    total_wards_active: int


class ResolutionTimeMetrics(BaseModel):
    average_resolution_hours: float
    median_resolution_hours: float
    average_triage_minutes: float
    fastest_resolved_hours: float
    compliance_target_hours: float
    history: List[Dict[str, Any]] = Field(default_factory=list)


class SlaGovernanceMetrics(BaseModel):
    overall_compliance_pct: float
    statutory_72h_met_pct: float
    acknowledgement_compliance_pct: float
    on_track_count: int
    near_breach_count: int
    breached_count: int
    total_evaluated: int


class EscalationBreakdown(BaseModel):
    tier1_count: int = Field(0, description="Ward Junior Engineer level")
    tier2_count: int = Field(0, description="Executive Engineer level")
    tier3_count: int = Field(0, description="Additional Municipal Commissioner level")
    total_escalations: int = 0
    top_escalation_driver: str = "Unassigned / Pending Officer Action"
    breach_rate_pct: float = 0.0


class HazardCluster(BaseModel):
    id: str
    ward: str
    title: str
    hazard_type: str
    complaint_count: int
    merged_work_orders: int
    risk_level: str  # HIGH, CRITICAL, MODERATE
    latitude: float
    longitude: float
    status: str  # ACTIVE, ACTION_SCHEDULED, RESOLVED
    last_updated: str


class EvidenceOutcomes(BaseModel):
    authentic_pct: float
    suspicious_tampered_pct: float
    gps_verified_pct: float
    total_evidence_scanned: int
    tamper_prevented_count: int


class RecommendationOutcomes(BaseModel):
    directly_accepted_pct: float
    officer_modified_pct: float
    rejected_override_pct: float
    total_recommendations: int
    ai_officer_alignment_score: float  # out of 100


class AgentActivityMetrics(BaseModel):
    total_sentinel_cycles: int
    proactive_followups_dispatched: int
    evidence_requests_sent: int
    citizen_notifications_broadcast: int
    autonomous_escalations_triggered: int
    active_monitored_cases: int


class AnalyticsOverviewResponse(BaseModel):
    summary_cards: List[MetricCard]
    categories: CategoryBreakdown
    departments: DepartmentBreakdown
    wards: WardBreakdown
    resolution: ResolutionTimeMetrics
    sla: SlaGovernanceMetrics
    escalations: EscalationBreakdown
    clusters: List[HazardCluster]
    evidence: EvidenceOutcomes
    recommendations: RecommendationOutcomes
    agent: AgentActivityMetrics
    scope: str = "ALL_PMC_WARDS"
    timestamp: str
