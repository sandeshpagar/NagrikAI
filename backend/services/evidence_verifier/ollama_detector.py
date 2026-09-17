import base64
import json
import logging
from typing import Dict, Any
import urllib.request
import urllib.error

from config import settings
from .base import BaseTamperDetector, TamperAnalysisResult
from .heuristic_detector import HeuristicTamperDetector

logger = logging.getLogger("nagrikai.evidence.ollama")

class OllamaVisionDetector(BaseTamperDetector):
    """
    Local Ollama Vision Detector utilizing llama3.2-vision or llava
    for zero-cost, offline visual artifact analysis. Falls back to Heuristics if unavailable.
    """
    def __init__(self, base_url: str = None, model: str = None):
        self.base_url = base_url or settings.OLLAMA_BASE_URL
        self.model = model or settings.OLLAMA_VISION_MODEL
        self.fallback = HeuristicTamperDetector()

    def analyze(self, image_bytes: bytes, metadata: Dict[str, Any]) -> TamperAnalysisResult:
        if not image_bytes:
            return self.fallback.analyze(image_bytes, metadata)

        try:
            b64_image = base64.b64encode(image_bytes).decode("utf-8")
            prompt = (
                "You are an expert civic fraud detection model. Inspect this municipal complaint photo. "
                "Evaluate if this image shows genuine physical damage (pothole, water leak, garbage, wire) "
                "or if it contains generative AI hallucination artifacts, cartoon textures, or digital manipulation. "
                "Respond ONLY with a JSON object: {\"risk_score\": 0.04, \"is_ai_generated\": false, \"details\": \"Brief reason\"}."
            )

            req_payload = {
                "model": self.model,
                "prompt": prompt,
                "images": [b64_image],
                "stream": False,
                "format": "json",
            }

            req = urllib.request.Request(
                f"{self.base_url}/api/generate",
                data=json.dumps(req_payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )

            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status == 200:
                    resp_json = json.loads(response.read().decode("utf-8"))
                    raw_response = resp_json.get("response", "{}")
                    parsed = json.loads(raw_response)

                    risk = min(0.98, max(0.01, float(parsed.get("risk_score", 0.05))))
                    is_ai = bool(parsed.get("is_ai_generated", False))
                    details = parsed.get("details", "Ollama Vision model assessed on-site visual authenticity.")

                    return TamperAnalysisResult(
                        risk_score=risk,
                        is_ai_generated=is_ai,
                        detected_software=self.model if is_ai else None,
                        confidence=min(98.4, 90.0 + (1.0 - risk) * 8.0),
                        details=f"[Ollama {self.model}] {details}",
                        metadata={"model": self.model, "source": "ollama_vision"}
                    )
        except Exception as e:
            logger.info(f"Ollama vision inference offline ({e}), seamlessly employing forensic heuristic detector.")

        # Seamless local fallback
        return self.fallback.analyze(image_bytes, metadata)
