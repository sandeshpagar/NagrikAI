import sys
from pathlib import Path
import pytest
from datetime import datetime, timezone

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from services.response_interpreter import (
    response_interpreter_service,
    OfficerActionSubmission,
    ConfirmRecommendationRequest,
    ModifyRecommendationRequest
)
from main import app
from fastapi.testclient import TestClient

client = TestClient(app)

def test_explicit_status_transition():
    sub = OfficerActionSubmission(
        grievance_id="GRV-TEST-OFFICER-001",
        officer_name="Er. Rajesh Sharma",
        status_intent="RESOLVED",
        directive_text="Patching completed using cold mix asphalt.",
        resolution_notes="Work order PMC-2026-991 signed off."
    )
    res = response_interpreter_service.interpret_submission(sub, current_grievance={"status": "IN_PROGRESS"})
    assert res.status == "RESOLVED"
    assert res.is_ambiguous is False
    assert res.confidence == 1.0
    assert "resolved" in res.plain_language_summary.lower()

def test_confirm_ai_recommendation():
    req = ConfirmRecommendationRequest(
        grievance_id="GRV-TEST-CONFIRM-001",
        officer_name="Er. Rajesh Sharma",
        notes="Proceeding with standard dispatch."
    )
    res = response_interpreter_service.confirm_recommendation(req)
    assert res["success"] is True
    assert res["status"] == "IN_PROGRESS"
    assert res["validated"]["recommendation_decision"] == "CONFIRMED"

def test_modify_ai_recommendation():
    req = ModifyRecommendationRequest(
        grievance_id="GRV-TEST-MODIFY-001",
        custom_action="Deploy heavy road milling and hot-mix paver.",
        reason="Sub-base structural damage requires deep compaction.",
        officer_name="Er. Sunita Deshpande"
    )
    res = response_interpreter_service.modify_recommendation(req)
    assert res["success"] is True
    assert res["status"] == "IN_PROGRESS"
    assert res["validated"]["recommendation_decision"] == "MODIFIED"

def test_ambiguity_guardrail_preserves_status():
    # Vague, non-committal directive without explicit status
    sub = OfficerActionSubmission(
        grievance_id="GRV-TEST-AMBIGUOUS-001",
        directive_text="Maybe we will look into this later when team is free."
    )
    res = response_interpreter_service.interpret_submission(
        sub,
        current_grievance={"status": "ASSIGNED", "title": "Pothole in Ward 12"}
    )
    # STRICT GUARDRAIL: Must retain previous status, mark ambiguous, and NOT invent a status
    assert res.status == "ASSIGNED"
    assert res.is_ambiguous is True
    assert res.clarification_requested is not None
    assert res.confidence < 0.70

def test_officer_response_api_endpoints():
    # 1. POST /api/v1/authority/response with explicit status
    resp = client.post("/api/v1/authority/response", json={
        "grievance_id": "GRV-2026-1042",
        "directive_text": "Pothole repair scheduled for tomorrow 10 AM.",
        "status_intent": "ACTION_SCHEDULED",
        "expected_action_date": "2026-09-19T10:00:00Z",
        "officer_name": "Er. Rajesh Sharma"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["new_status"] == "ACTION_SCHEDULED"
    assert data["is_ambiguous"] is False

    # 2. POST /api/v1/authority/response with ambiguous directive
    resp_ambig = client.post("/api/v1/authority/response", json={
        "grievance_id": "GRV-2026-1042",
        "directive_text": "Checking with team sometime later maybe."
    })
    assert resp_ambig.status_code == 200
    data_ambig = resp_ambig.json()
    assert data_ambig["success"] is True
    assert data_ambig["is_ambiguous"] is True

    # 3. POST /api/v1/authority/confirm-recommendation
    resp_conf = client.post("/api/v1/authority/confirm-recommendation", json={
        "grievance_id": "GRV-2026-1042",
        "notes": "Confirmed SOP."
    })
    assert resp_conf.status_code == 200
    assert resp_conf.json()["success"] is True

    # 4. POST /api/v1/authority/modify-recommendation
    resp_mod = client.post("/api/v1/authority/modify-recommendation", json={
        "grievance_id": "GRV-2026-1042",
        "custom_action": "Hot mix asphalt patching.",
        "reason": "Rain forecasted."
    })
    assert resp_mod.status_code == 200
    assert resp_mod.json()["success"] is True

    # 5. POST /api/v1/authority/interpret-directive (stateless)
    resp_stateless = client.post("/api/v1/authority/interpret-directive", json={
        "grievance_id": "GRV-2026-1042",
        "directive_text": "Work completed and inspected.",
        "status_intent": "RESOLVED"
    })
    assert resp_stateless.status_code == 200
    assert resp_stateless.json()["validated"]["status"] == "RESOLVED"
