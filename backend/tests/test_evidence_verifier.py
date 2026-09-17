import unittest
from services.evidence_verifier.base import BaseTamperDetector, TamperAnalysisResult
from services.evidence_verifier.heuristic_detector import HeuristicTamperDetector
from services.evidence_verifier.verifier import (
    EvidenceVerifier,
    STATUS_LIKELY_AUTHENTIC,
    STATUS_NEEDS_VERIFICATION,
    STATUS_POTENTIALLY_MANIPULATED,
    STATUS_INSUFFICIENT_EVIDENCE,
)

class MockCustomTamperDetector(BaseTamperDetector):
    def __init__(self, fixed_risk: float, is_ai: bool):
        self.fixed_risk = fixed_risk
        self.is_ai = is_ai

    def analyze(self, image_bytes: bytes, metadata: dict) -> TamperAnalysisResult:
        return TamperAnalysisResult(
            risk_score=self.fixed_risk,
            is_ai_generated=self.is_ai,
            detected_software="MockDetector",
            confidence=95.0,
            details="Mock analysis completed"
        )

class TestEvidenceVerifier(unittest.TestCase):
    def setUp(self):
        self.verifier = EvidenceVerifier()
        # Create 12KB dummy byte payload
        self.sample_bytes = b"0" * 12000

    def test_likely_authentic_camera_photo(self):
        meta = {
            "device": "Apple iPhone 14 Pro",
            "lens": "24mm f/1.78",
            "latitude": 18.4965,
            "longitude": 73.8312,
            "dateTime": "17 Sep 10:28 AM",
        }
        report = self.verifier.verify(
            file_bytes=self.sample_bytes,
            file_name="pothole_field.jpg",
            reported_lat=18.4966,
            reported_lng=73.8310,
            metadata=meta
        )
        self.assertEqual(report.verification_status, STATUS_LIKELY_AUTHENTIC)
        self.assertLessEqual(report.confidence, 98.4)  # Never claims 100%
        self.assertLess(report.risk_score, 0.15)
        self.assertTrue(report.location_match)
        self.assertIsNotNone(report.sha256)

    def test_spatial_discrepancy_needs_verification(self):
        # EXIF GPS in Mumbai, filed for Sinhagad Pune (120km away)
        meta = {
            "device": "Samsung Galaxy S23",
            "latitude": 19.0760,
            "longitude": 72.8777,
        }
        report = self.verifier.verify(
            file_bytes=self.sample_bytes,
            file_name="pothole_far.jpg",
            reported_lat=18.4965,
            reported_lng=73.8312,
            metadata=meta
        )
        self.assertEqual(report.verification_status, STATUS_NEEDS_VERIFICATION)
        self.assertFalse(report.location_match)
        self.assertGreater(report.gps_delta_meters, 500.0)

    def test_ai_generated_image_detected(self):
        meta = {
            "software": "Midjourney v6.0",
            "device": "Virtual Camera",
        }
        report = self.verifier.verify(
            file_bytes=self.sample_bytes,
            file_name="ai_fake_flood.jpg",
            reported_lat=18.4965,
            reported_lng=73.8312,
            metadata=meta
        )
        self.assertEqual(report.verification_status, STATUS_POTENTIALLY_MANIPULATED)
        self.assertTrue(report.tamper_result.is_ai_generated)
        self.assertGreaterEqual(report.risk_score, 0.60)

    def test_insufficient_evidence_for_tiny_file(self):
        tiny_bytes = b"corrupt"  # Only 7 bytes
        report = self.verifier.verify(
            file_bytes=tiny_bytes,
            file_name="corrupt.jpg",
            reported_lat=18.4965,
            reported_lng=73.8312,
            metadata={}
        )
        self.assertEqual(report.verification_status, STATUS_INSUFFICIENT_EVIDENCE)

    def test_pluggable_detector_injection(self):
        # Verify custom detector can be injected behind the interface
        mock_detector = MockCustomTamperDetector(fixed_risk=0.85, is_ai=True)
        custom_verifier = EvidenceVerifier(detector=mock_detector)
        report = custom_verifier.verify(
            file_bytes=self.sample_bytes,
            file_name="test.jpg",
            reported_lat=18.4965,
            reported_lng=73.8312,
            metadata={"device": "TestPhone"}
        )
        self.assertEqual(report.verification_status, STATUS_POTENTIALLY_MANIPULATED)
        self.assertEqual(report.risk_score, 0.85)

if __name__ == "__main__":
    unittest.main()
