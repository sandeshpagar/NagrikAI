import sys
from pathlib import Path
import pytest
from datetime import datetime, timedelta

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from services.grievance_agent.state import create_initial_agent_state
from services.grievance_agent.tools import GrievanceAgentTools
from services.grievance_agent.graph import GrievanceAgentRunner
from services.llm_provider.factory import get_llm_provider, HeuristicLLMProvider

SAMPLE_GRIEVANCE_ID = "GRV-TEST-2026-001"

@pytest.fixture
def agent_tools():
    return GrievanceAgentTools()

@pytest.fixture
def agent_runner(agent_tools):
    return GrievanceAgentRunner(tools=agent_tools)

def test_initial_state_creation():
    state = create_initial_agent_state(
        SAMPLE_GRIEVANCE_ID,
        {"title": "Open Manhole on Sinhagad Road", "priority": "CRITICAL", "ward": "Ward 12"}
    )
    assert state["grievance_id"] == SAMPLE_GRIEVANCE_ID
    assert state["status"] == "SUBMITTED"
    assert state["priority"] == "CRITICAL"
    assert state["escalation_level"] == 0
    assert state["next_step"] == "INSPECT_STATE"
    assert len(state["logs"]) > 0

def test_tool_get_authority_hierarchy(agent_tools):
    # Level 0: Field Engineer
    auth_l0 = agent_tools.get_authority("Ward 12 - Sinhagad Zone", "Road Infrastructure", escalation_level=0)
    assert auth_l0["escalation_tier"] == 0
    assert "email" in auth_l0

    # Level 1: Superintending Engineer / Dept Head
    auth_l1 = agent_tools.get_authority("Ward 12 - Sinhagad Zone", "Road Infrastructure", escalation_level=1)
    assert auth_l1["escalation_tier"] == 1
    assert "Deshmukh" in auth_l1["name"]

    # Level 2: Additional Municipal Commissioner
    auth_l2 = agent_tools.get_authority("Ward 12 - Sinhagad Zone", "Road Infrastructure", escalation_level=2)
    assert auth_l2["escalation_tier"] == 2
    assert "Commissioner" in auth_l2["designation"]

def test_tool_email_and_idempotency(agent_tools):
    grv = agent_tools.get_grievance(SAMPLE_GRIEVANCE_ID)
    auth = agent_tools.get_authority("Ward 12", "Road Infrastructure", escalation_level=0)
    
    # First dispatch
    res1 = agent_tools.send_authority_email(grv, auth)
    assert res1["success"] is True

    # Immediate second dispatch should be marked duplicate
    res2 = agent_tools.send_authority_email(grv, auth)
    assert res2["success"] is True
    assert res2["is_duplicate"] is True

def test_tool_status_update_and_audit(agent_tools):
    ok = agent_tools.update_grievance_status(SAMPLE_GRIEVANCE_ID, status="ASSIGNED", directive="Assigned to squad")
    assert ok is True

    audit_ok = agent_tools.create_audit_event(
        action="TEST_ACTION",
        details="Automated test audit record",
        grievance_id=SAMPLE_GRIEVANCE_ID
    )
    assert audit_ok is True

def test_tool_escalate_grievance(agent_tools):
    res = agent_tools.escalate_grievance(
        grievance_id=SAMPLE_GRIEVANCE_ID,
        current_level=0,
        reason="SLA window exceeded without field update."
    )
    assert res["escalation_level"] == 1
    assert "senior_authority" in res
    assert res["senior_authority"]["escalation_tier"] == 1

def test_llm_provider_fallback():
    provider = get_llm_provider("heuristic")
    assert provider.is_available() is True
    
    text = provider.generate_text("Explain grievance status to citizen")
    assert len(text) > 0

    json_data = provider.generate_json("Analyze pothole on main road")
    assert "category" in json_data
    assert "priority" in json_data

def test_agent_triage_cycle(agent_runner):
    # Step 1: Inspect state -> routes to TRIAGE_AND_ROUTE
    state = agent_runner.step(SAMPLE_GRIEVANCE_ID)
    assert state["next_step"] in ["TRIAGE_AND_ROUTE", "NOTIFY_AUTHORITY"]

    # Step 2: Triage & Route -> maps authority, status = ASSIGNED
    state = agent_runner.step(SAMPLE_GRIEVANCE_ID)
    assert state["status"] in ["ASSIGNED", "SUBMITTED"]
    assert state["authority_id"] is not None

    # Step 3: Notify Authority -> sends notice
    state = agent_runner.step(SAMPLE_GRIEVANCE_ID)
    assert state["followup_count"] >= 1
    assert state["last_followup_at"] is not None

def test_agent_resolution_flow(agent_runner, agent_tools):
    test_id = "GRV-RESOLVE-TEST-002"
    agent_tools.update_grievance_status(
        test_id,
        status="ACTION_SCHEDULED",
        directive="Asphalt compaction completed by Ward 12 road maintenance squad."
    )
    
    state = agent_runner.get_state(test_id)
    state["status"] = "ACTION_SCHEDULED"
    state["next_step"] = "CHECK_SLA_AND_RESPONSE"
    agent_runner.save_state(state)

    # Advance agent
    updated = agent_runner.run(test_id, max_steps=4)
    assert updated["completed"] is True or updated["status"] in ["RESOLVED", "ACTION_SCHEDULED"]
    assert len(updated["logs"]) > 1
