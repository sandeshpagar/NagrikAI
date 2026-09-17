import sys
from pathlib import Path
import pytest

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from services.ai_analyzer.base import GrievanceAnalysisInput, GrievanceAnalysisOutput
from services.ai_analyzer.heuristic_analyzer import HeuristicCivicAnalyzer
from services.ai_analyzer.ollama_analyzer import OllamaGrievanceAnalyzer

def test_heuristic_analyzer_english_road_critical():
    analyzer = HeuristicCivicAnalyzer()
    input_data = GrievanceAnalysisInput(
        complaint_text="Severe 2-foot pothole on Sinhagad Road near Abhiruchi Mall causing major two-wheeler skidding accident. Immediate repair needed.",
        language="English",
        location={"ward": "Ward 12", "address": "Sinhagad Road, Pune"},
        evidence_analysis={"verification_status": "LIKELY_AUTHENTIC", "risk_score": 0.02}
    )
    result = analyzer.analyze(input_data)

    assert isinstance(result, GrievanceAnalysisOutput)
    assert result.category == "Road Infrastructure & Public Safety"
    assert result.priority == "CRITICAL"  # Triggered by 'accident'
    assert result.affected_population >= 2500
    assert result.confidence >= 80.0
    assert len(result.entities) > 0
    assert any(e.type == "LOCATION" or e.type == "LANDMARK" for e in result.entities)
    assert "bituminous patch" in result.recommended_action or "barricade" in result.recommended_action
    assert result.is_fallback is True

def test_heuristic_analyzer_marathi_complaint():
    analyzer = HeuristicCivicAnalyzer()
    input_data = GrievanceAnalysisInput(
        complaint_text="सिंहगड रस्त्यावर मोठा खड्डा पडला आहे, काल रात्री दुचाकी घसरून अपघात झाला, तातडीने दुरुस्ती करा.",
        language="Marathi",
        location={"ward": "प्रभाग १२", "address": "सिंहगड रोड, पुणे"}
    )
    result = analyzer.analyze(input_data)

    assert result.category == "Road Infrastructure & Public Safety"
    assert result.priority == "CRITICAL"  # 'अपघात' trigger
    assert result.confidence >= 75.0
    assert "Road Maintenance" in result.department

def test_heuristic_analyzer_hindi_water_pipeline():
    analyzer = HeuristicCivicAnalyzer()
    input_data = GrievanceAnalysisInput(
        complaint_text="मेन पाइपलाइन फूट गई है और सारा गंदा पानी सड़क पर बह रहा है, पीने का पानी दूषित हो गया है और बदबू आ रही है.",
        language="Hindi",
        location={"ward": "वार्ड ४", "address": "शिवाजी नगर"}
    )
    result = analyzer.analyze(input_data)

    assert result.category == "Water Supply & Sewerage"
    assert "Water Supply" in result.department
    assert result.priority in ("CRITICAL", "HIGH")
    assert result.affected_population >= 3000

def test_heuristic_analyzer_electricity_hazard():
    analyzer = HeuristicCivicAnalyzer()
    input_data = GrievanceAnalysisInput(
        complaint_text="High voltage electric wire hanging loose and sparking near primary school in Ward 8. Dangerous spark!",
        language="English",
        location={"ward": "Ward 8", "address": "Kothrud, Pune"}
    )
    result = analyzer.analyze(input_data)

    assert result.category == "Electricity & Street Lighting"
    assert result.priority == "CRITICAL"  # 'school' and 'spark' triggers
    assert result.severity_score >= 8.5
    assert "Electrical" in result.department

def test_ollama_offline_safe_fallback():
    # Points to non-existent port to test offline fallback
    offline_analyzer = OllamaGrievanceAnalyzer(base_url="http://127.0.0.1:59999", model="non-existent")
    input_data = GrievanceAnalysisInput(
        complaint_text="Garbage bin overflowing with rotting waste and foul smell near municipal market.",
        language="English",
        location={"ward": "Ward 5", "address": "Market Yard"}
    )
    # Must NOT raise exception; must gracefully return validated fallback
    result = offline_analyzer.analyze(input_data)

    assert isinstance(result, GrievanceAnalysisOutput)
    assert result.category == "Solid Waste Management"
    assert result.is_fallback is True
    assert result.priority in ("HIGH", "MEDIUM")

if __name__ == "__main__":
    test_heuristic_analyzer_english_road_critical()
    test_heuristic_analyzer_marathi_complaint()
    test_heuristic_analyzer_hindi_water_pipeline()
    test_heuristic_analyzer_electricity_hazard()
    test_ollama_offline_safe_fallback()
    print("ALL 5 AI ANALYZER TESTS PASSED SUCCESSFULLY!")
