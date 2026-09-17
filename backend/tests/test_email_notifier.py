import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from services.email_notifier.base import EmailRecipient
from services.email_notifier.mock_adapter import MockEmailAdapter
from services.email_notifier.notifier_service import EmailNotifierService

SAMPLE_GRIEVANCE = {
    "id": "843d73f3db084240b322a506872dc7ab",
    "grievance_number": "GRV-2026-1042",
    "title": "Severe Road Crater & Exposed Electrical Conduit near Sinhagad Road Junction",
    "description": "Deep crater spanning 1.8 meters across opposite Petrol Pump on Sinhagad Road. Exposing live underground electrical wiring casing. Multiple two-wheelers skidded during rain yesterday evening.",
    "category": "Road Infrastructure & Public Safety",
    "priority": "HIGH",
    "address": "Sinhagad Road, Ward 12, Pune",
    "location": {
        "ward": "Ward 12",
        "zone": "Sinhagad Zone",
        "address": "Opposite HPCL Petrol Pump, Sinhagad Road Junction, Pune",
        "latitude": 18.4965,
        "longitude": 73.8312
    },
    "aiAnalysis": {
        "severityScore": 8.8,
        "affectedPopulationEstimate": "~14,500 daily commuters",
        "durationText": "3 days active hazard",
        "multimodalSummary": "Severe asphalt cavitation spanning 1.8m with subterranean moisture saturation and high-risk exposed electrical cabling.",
    },
    "recommendation": {
        "recommendedAction": "Deploy asphalt patch squad and coordinate immediate electrical sleeve casing.",
        "expectedResolutionHours": 24
    }
}

SAMPLE_RECIPIENT = EmailRecipient(
    name="Er. Rajesh Sharma",
    email="rajesh.sharma@pmc.gov.in",
    designation="Executive Engineer (Ward 12 Civil Division)",
    department="PMC Road Infrastructure & Civil Maintenance"
)

def test_official_pmc_email_content_completeness():
    service = EmailNotifierService(adapter=MockEmailAdapter())
    dashboard_link = "http://localhost:3000/authority/grievances/GRV-2026-1042"
    html = service.render_official_pmc_email_html(SAMPLE_GRIEVANCE, SAMPLE_RECIPIENT, dashboard_link)

    # 1. Grievance number
    assert "GRV-2026-1042" in html
    # 2. AI summary & metrics
    assert "8.8" in html
    assert "14,500" in html
    assert "3 days active hazard" in html
    # 3. Category
    assert "Road Infrastructure & Public Safety" in html
    # 4. Priority
    assert "HIGH" in html
    # 5. Location & GPS
    assert "Sinhagad Road" in html
    assert "Ward 12" in html
    assert "18.4965" in html
    assert "73.8312" in html
    # 6. Evidence status
    assert "LIKELY_AUTHENTIC" in html
    # 7. Recommendation directive
    assert "Deploy asphalt patch squad" in html
    # 8. Secure dashboard deep link
    assert dashboard_link in html
    # Statutory escalation warning
    assert "Maharashtra Right to Public Services Act, 2015" in html

def test_idempotency_deduplication():
    mock_adapter = MockEmailAdapter()
    service = EmailNotifierService(adapter=mock_adapter)

    # First dispatch
    res1 = service.send_authority_notice(SAMPLE_GRIEVANCE, SAMPLE_RECIPIENT)
    assert res1.success is True
    assert res1.is_duplicate is False
    assert len(mock_adapter.sent_messages) == 1

    # Immediate second dispatch (same grievance & recipient) -> Must be suppressed
    res2 = service.send_authority_notice(SAMPLE_GRIEVANCE, SAMPLE_RECIPIENT)
    assert res2.success is True
    assert res2.is_duplicate is True
    assert res2.message_id == res1.message_id
    assert len(mock_adapter.sent_messages) == 1, "Duplicate email should NOT have been transmitted"

    # Forced dispatch -> Must bypass idempotency
    res3 = service.send_authority_notice(SAMPLE_GRIEVANCE, SAMPLE_RECIPIENT, force=True)
    assert res3.success is True
    assert res3.is_duplicate is False
    assert len(mock_adapter.sent_messages) == 2

def test_mock_adapter_logging():
    mock_adapter = MockEmailAdapter()
    service = EmailNotifierService(adapter=mock_adapter)

    res = service.send_authority_notice(SAMPLE_GRIEVANCE, SAMPLE_RECIPIENT, force=True)
    assert res.provider == "MOCK"
    assert res.recipient_email == "rajesh.sharma@pmc.gov.in"
    assert res.message_id.startswith("MOCK-MSG-")

    history = mock_adapter.get_history()
    assert len(history) >= 1
    assert history[-1]["recipient"]["email"] == "rajesh.sharma@pmc.gov.in"

if __name__ == "__main__":
    test_official_pmc_email_content_completeness()
    test_idempotency_deduplication()
    test_mock_adapter_logging()
    print("ALL EMAIL NOTIFIER TESTS PASSED SUCCESSFULLY!")
