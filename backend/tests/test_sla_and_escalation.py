import sys
from pathlib import Path
import pytest
from datetime import datetime, timedelta, timezone

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from services.sla_engine import sla_engine, SlaRule, SlaRuleCreate
from services.escalation_engine import escalation_engine
from main import app
from fastapi.testclient import TestClient

client = TestClient(app)

def test_sla_rule_matching_specific_department():
    # 1. Road Infrastructure Critical -> 12h resolution, 2h ack
    rule_civil = sla_engine.match_rule(department_code="PMC-CIVIL", category="Road Infrastructure", priority="CRITICAL")
    assert rule_civil.department_code == "PMC-CIVIL"
    assert rule_civil.resolution_hours == 12
    assert rule_civil.acknowledgement_hours == 2

    # 2. Water Supply Critical -> 6h resolution, 1h ack
    rule_water = sla_engine.match_rule(department_code="PMC-WATER", category="Water Supply", priority="CRITICAL")
    assert rule_water.department_code == "PMC-WATER"
    assert rule_water.resolution_hours == 6
    assert rule_water.acknowledgement_hours == 1

def test_sla_rule_matching_fallback():
    # Unmapped category & unknown department -> matches apex fallback
    rule_fallback = sla_engine.match_rule(department_code="PMC-UNKNOWN", category="Unknown Issue", priority="UNKNOWN")
    assert rule_fallback.rule_id == "SLA-PMC-APEX-FALLBACK"
    assert rule_fallback.resolution_hours == 48

def test_sla_deadline_calculation():
    now_iso = datetime.now(timezone.utc).isoformat()
    deadlines = sla_engine.calculate_deadlines(
        created_at=now_iso,
        priority="HIGH",
        department_code="PMC-CIVIL",
        category="Road Infrastructure"
    )
    assert deadlines["acknowledgement_hours"] == 4
    assert deadlines["resolution_hours"] == 24
    assert "acknowledgement_deadline" in deadlines
    assert "resolution_deadline" in deadlines

def test_sla_evaluation_fresh_grievance():
    now = datetime.now(timezone.utc)
    res = sla_engine.evaluate_grievance({
        "id": "GRV-TEST-FRESH",
        "priority": "HIGH",
        "department_code": "PMC-CIVIL",
        "category": "Road Infrastructure",
        "status": "ASSIGNED",
        "created_at": now.isoformat()
    })
    assert res.is_overdue is False
    assert res.time_remaining_seconds > 0
    assert "remaining" in res.time_remaining_formatted
    assert res.urgency_level in ["NORMAL", "WARNING_SOON"]
    assert res.acknowledgement_status == "MET"

def test_sla_evaluation_overdue_grievance():
    past_time = datetime.now(timezone.utc) - timedelta(hours=36)
    res = sla_engine.evaluate_grievance({
        "id": "GRV-TEST-OVERDUE",
        "priority": "HIGH",
        "department_code": "PMC-CIVIL",
        "category": "Road Infrastructure",
        "status": "ASSIGNED",
        "created_at": past_time.isoformat(),
        "followup_count": 3
    })
    assert res.is_overdue is True
    assert res.time_remaining_seconds < 0
    assert "overdue" in res.time_remaining_formatted
    assert res.urgency_level == "CRITICAL_ESCALATION"
    assert res.escalation_recommended is True

def test_dynamic_escalation_chain_non_universal():
    # Civil grievance returns Civil hierarchy
    civil_chain = escalation_engine.get_escalation_chain(ward="Ward 12", category="Road Infrastructure", department="PMC-CIVIL")
    assert len(civil_chain) >= 2
    assert "Civil" in civil_chain[0]["designation"] or "Road" in civil_chain[0]["designation"] or "Engineer" in civil_chain[0]["designation"]

    # Water grievance returns Water hierarchy
    water_chain = escalation_engine.get_escalation_chain(ward="Ward 8", category="Water Supply Contamination", department="PMC-WATER")
    assert len(water_chain) >= 2
    # Ensure hierarchy differs from road infrastructure
    assert any("Water" in t["designation"] or "Sanitary" in t["designation"] or "Drainage" in t["designation"] for t in water_chain)

def test_execute_escalation():
    event = escalation_engine.execute_escalation(
        grievance_id="GRV-TEST-EXEC-001",
        target_level=1,
        reason="Field inspection SLA exceeded by 18 hours.",
        actor_type="ADMIN",
        actor_name="Zonal Officer Deshpande"
    )
    assert event.to_level == 1
    assert event.grievance_id == "GRV-TEST-EXEC-001"
    assert "Deshpande" in event.trigger_reason or "exceeded" in event.trigger_reason
    assert "email" in event.to_authority
    assert "id" in event.id

def test_sla_and_escalation_api_endpoints():
    # 1. Test GET /api/v1/sla/rules
    resp_rules = client.get("/api/v1/sla/rules")
    assert resp_rules.status_code == 200
    data_rules = resp_rules.json()
    assert data_rules["success"] is True
    assert data_rules["total"] >= 5

    # 2. Test GET /api/v1/sla/status/{id}
    resp_status = client.get("/api/v1/sla/status/GRV-2026-1042")
    assert resp_status.status_code == 200
    data_status = resp_status.json()
    assert data_status["success"] is True
    assert "evaluation" in data_status
    assert "time_remaining_formatted" in data_status["evaluation"]

    # 3. Test GET /api/v1/escalations/{id}
    resp_esc = client.get("/api/v1/escalations/GRV-2026-1042")
    assert resp_esc.status_code == 200
    data_esc = resp_esc.json()
    assert data_esc["success"] is True
    assert "escalation_chain" in data_esc

    # 4. Test POST /api/v1/escalations/trigger
    resp_trig = client.post("/api/v1/escalations/trigger", json={
        "grievance_id": "GRV-2026-1042",
        "reason": "Repeated citizen alert on unresolved arterial hazard.",
        "actor_type": "OFFICER",
        "actor_name": "Ward Inspector"
    })
    assert resp_trig.status_code == 200
    data_trig = resp_trig.json()
    assert data_trig["success"] is True
    assert data_trig["event"]["to_level"] >= 1
