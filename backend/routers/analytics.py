"""
NagrikAI Analytics API Router (Phase 16)
Provides RESTful endpoints for municipal performance, SLA compliance,
recurring hazard clusters, and AI agent operation metrics.
"""

from typing import Optional
from fastapi import APIRouter, Query, status

from services.analytics_engine import (
    get_analytics_engine,
    AnalyticsOverviewResponse,
    CategoryBreakdown,
    DepartmentBreakdown,
    WardBreakdown,
    SlaGovernanceMetrics,
    HazardCluster,
    AgentActivityMetrics,
)

router = APIRouter(prefix="/analytics", tags=["Analytics & Civic Intelligence"])


@router.get("/overview", response_model=AnalyticsOverviewResponse, status_code=status.HTTP_200_OK)
async def get_analytics_overview(
    ward: Optional[str] = Query(None, description="Optional filter by Ward e.g. 'Ward 12'"),
    timeframe: str = Query("30d", description="Timeframe window: '7d', '30d', 'quarter', 'all'")
):
    """
    Returns complete civic intelligence analytics overview across all 10 dimensions.
    """
    engine = get_analytics_engine()
    return engine.get_overview(ward_filter=ward, timeframe=timeframe)


@router.get("/breakdowns", response_model=dict, status_code=status.HTTP_200_OK)
async def get_analytics_breakdowns(
    ward: Optional[str] = Query(None, description="Optional filter by Ward")
):
    """
    Returns grievance distributions by Category, Department, and Ward.
    """
    engine = get_analytics_engine()
    overview = engine.get_overview(ward_filter=ward)
    return {
        "categories": overview.categories,
        "departments": overview.departments,
        "wards": overview.wards
    }


@router.get("/governance", response_model=dict, status_code=status.HTTP_200_OK)
async def get_governance_metrics(
    ward: Optional[str] = Query(None, description="Optional filter by Ward")
):
    """
    Returns SLA compliance, Escalation tier pyramid, Evidence forensics, and AI alignment.
    """
    engine = get_analytics_engine()
    overview = engine.get_overview(ward_filter=ward)
    return {
        "sla": overview.sla,
        "escalations": overview.escalations,
        "evidence": overview.evidence,
        "recommendations": overview.recommendations
    }


@router.get("/clusters", response_model=list[HazardCluster], status_code=status.HTTP_200_OK)
async def get_hazard_clusters(
    ward: Optional[str] = Query(None, description="Optional filter by Ward")
):
    """
    Returns spatial deduplication and recurring hazard geo-clusters.
    """
    engine = get_analytics_engine()
    overview = engine.get_overview(ward_filter=ward)
    return overview.clusters


@router.get("/agent", response_model=AgentActivityMetrics, status_code=status.HTTP_200_OK)
async def get_agent_metrics():
    """
    Returns LangGraph autonomous sentinel cycles, proactive follow-ups, and notifications.
    """
    engine = get_analytics_engine()
    overview = engine.get_overview()
    return overview.agent


@router.get("/admin", response_model=AnalyticsOverviewResponse, status_code=status.HTTP_200_OK)
async def get_admin_analytics():
    """
    Administrative overview covering all Pune Municipal Corporation wards and divisions.
    """
    engine = get_analytics_engine()
    return engine.get_overview(ward_filter="ALL_PMC_ADMIN")
