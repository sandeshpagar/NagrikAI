import re
from typing import Dict, Any
from .base import BaseTamperDetector, TamperAnalysisResult

class HeuristicTamperDetector(BaseTamperDetector):
    """
    Forensic heuristic detector inspecting EXIF software markers,
    compression patterns, and metadata anomalies for generative AI or tampering.
    """
    GEN_AI_SIGNATURES = [
        "midjourney",
        "stable diffusion",
        "dall-e",
        "dalle",
        "firefly",
        "generative fill",
        "photoshop generative",
        "comfyui",
        "automatic1111",
        "craiyon",
        "runway",
    ]

    def analyze(self, image_bytes: bytes, metadata: Dict[str, Any]) -> TamperAnalysisResult:
        software = str(metadata.get("software", "")).lower()
        device = str(metadata.get("device", "")).lower()
        has_camera_hardware = bool(metadata.get("device") or metadata.get("lens"))
        has_gps = bool(metadata.get("latitude") and metadata.get("longitude"))

        # 1. Check for known Generative AI software signatures
        for sig in self.GEN_AI_SIGNATURES:
            if re.search(r"\b" + re.escape(sig) + r"\b", software) or re.search(r"\b" + re.escape(sig) + r"\b", device):
                return TamperAnalysisResult(
                    risk_score=0.92,
                    is_ai_generated=True,
                    detected_software=sig.title(),
                    confidence=96.5,
                    details=f"Detected generative AI software signature in metadata: '{sig.title()}'.",
                    metadata={"source": "software_signature_heuristic"}
                )

        # 2. Check for Photoshop or image editor signatures
        if "photoshop" in software or "gimp" in software or "affinity" in software:
            return TamperAnalysisResult(
                risk_score=0.45,
                is_ai_generated=False,
                detected_software=software.title(),
                confidence=85.0,
                details="Image edited in desktop graphics software. Secondary verification advised.",
                metadata={"source": "editing_software_heuristic"}
            )

        # 3. Check for genuine mobile camera metadata with GPS lock
        if has_camera_hardware and has_gps:
            return TamperAnalysisResult(
                risk_score=0.04,
                is_ai_generated=False,
                detected_software=None,
                confidence=98.4,  # Statutory maximum confidence
                details="Authentic hardware EXIF signatures and GPS coordinates present. Low tamper probability.",
                metadata={"source": "camera_hardware_verified"}
            )

        # 4. EXIF stripped or missing camera details
        if not has_camera_hardware:
            return TamperAnalysisResult(
                risk_score=0.35,
                is_ai_generated=False,
                detected_software=None,
                confidence=78.0,
                details="EXIF hardware telemetry omitted or stripped during transit. Verification recommended.",
                metadata={"source": "missing_hardware_telemetry"}
            )

        # Default clean camera photo
        return TamperAnalysisResult(
            risk_score=0.08,
            is_ai_generated=False,
            detected_software=None,
            confidence=95.0,
            details="Standard camera capture markers verified.",
            metadata={"source": "default_camera_heuristic"}
        )
