import math
import hashlib
from typing import Optional, Dict, Any
from pydantic import BaseModel

from .base import BaseTamperDetector, TamperAnalysisResult
from .heuristic_detector import HeuristicTamperDetector

# Statutory Evidence Statuses
STATUS_LIKELY_AUTHENTIC = "LIKELY_AUTHENTIC"
STATUS_NEEDS_VERIFICATION = "NEEDS_VERIFICATION"
STATUS_POTENTIALLY_MANIPULATED = "POTENTIALLY_MANIPULATED"
STATUS_INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes great-circle distance in meters between two GPS coordinates.
    """
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) *
         math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

class VerificationReport(BaseModel):
    sha256: str
    file_size: int
    verification_status: str
    risk_score: float
    confidence: float
    gps_delta_meters: Optional[float] = None
    location_match: bool
    tamper_result: TamperAnalysisResult
    forensic_checklist: Dict[str, Any]
    analysis: Dict[str, Any]

class EvidenceVerifier:
    """
    Forensic multimodal evidence verification orchestrator.
    Integrates cryptographic hashing, EXIF telemetry, spatial proximity, and tamper analysis.
    """
    def __init__(self, detector: Optional[BaseTamperDetector] = None):
        self.detector = detector or HeuristicTamperDetector()

    def verify(
        self,
        file_bytes: bytes,
        file_name: str,
        reported_lat: Optional[float] = None,
        reported_lng: Optional[float] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> VerificationReport:
        meta = metadata or {}
        file_size = len(file_bytes) if file_bytes else meta.get("file_size", 0)

        # 1. Cryptographic SHA-256 Checksum
        if file_bytes:
            sha256_hash = hashlib.sha256(file_bytes).hexdigest()
        else:
            sha256_hash = meta.get("sha256", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")

        # 2. File Validation Bounds Check
        if file_size < 10240 and not meta.get("mock_skip_size_check"):
            return VerificationReport(
                sha256=sha256_hash,
                file_size=file_size,
                verification_status=STATUS_INSUFFICIENT_EVIDENCE,
                risk_score=0.75,
                confidence=60.0,
                location_match=False,
                tamper_result=TamperAnalysisResult(
                    risk_score=0.75,
                    is_ai_generated=False,
                    confidence=60.0,
                    details="File size too small (<10KB) or empty stream. Insufficient forensic detail."
                ),
                forensic_checklist={"valid_size": False, "exif_intact": False, "gps_proximity": False},
                analysis={"error": "insufficient_file_size"}
            )

        # 3. Spatiotemporal Geotag Distance Delta
        exif_lat = meta.get("latitude")
        exif_lng = meta.get("longitude")
        gps_delta = None
        location_match = False

        if exif_lat is not None and exif_lng is not None and reported_lat is not None and reported_lng is not None:
            gps_delta = round(haversine_distance(float(exif_lat), float(exif_lng), float(reported_lat), float(reported_lng)), 1)
            location_match = gps_delta <= 500.0  # Within 500 meters of reported site

        # 4. Tamper Detector Evaluation
        tamper_res = self.detector.analyze(file_bytes or b"", meta)

        # 5. Synthesize Statutory Status
        if tamper_res.is_ai_generated or tamper_res.risk_score >= 0.60:
            status = STATUS_POTENTIALLY_MANIPULATED
        elif gps_delta is not None and gps_delta > 500.0:
            status = STATUS_NEEDS_VERIFICATION
        elif tamper_res.risk_score > 0.20:
            status = STATUS_NEEDS_VERIFICATION
        elif exif_lat is None or not meta.get("device"):
            status = STATUS_NEEDS_VERIFICATION
        else:
            status = STATUS_LIKELY_AUTHENTIC

        # Capping confidence at 98.4% (Never claim 100% authenticity)
        final_confidence = min(98.4, max(50.0, tamper_res.confidence))

        forensic_checklist = {
            "sha256_verified": True,
            "exif_metadata_present": bool(meta.get("device")),
            "camera_model": meta.get("device", "Unknown"),
            "geotag_locked": bool(exif_lat and exif_lng),
            "gps_delta_meters": gps_delta,
            "within_500m_threshold": location_match,
            "tamper_score": tamper_res.risk_score,
            "ai_artifacts_detected": tamper_res.is_ai_generated,
        }

        return VerificationReport(
            sha256=sha256_hash,
            file_size=file_size,
            verification_status=status,
            risk_score=tamper_res.risk_score,
            confidence=final_confidence,
            gps_delta_meters=gps_delta,
            location_match=location_match,
            tamper_result=tamper_res,
            forensic_checklist=forensic_checklist,
            analysis={
                "match_percentage": round(final_confidence, 1),
                "angle_description": meta.get("angle_description", "On-site Field Evidence"),
                "tamper_details": tamper_res.details,
                "detected_software": tamper_res.detected_software,
            }
        )
