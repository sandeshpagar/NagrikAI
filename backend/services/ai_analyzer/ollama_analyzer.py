import json
import logging
import urllib.request
import urllib.error
from typing import Optional

from config import settings
from .base import (
    BaseGrievanceAnalyzer,
    GrievanceAnalysisInput,
    GrievanceAnalysisOutput,
    CivicEntity,
)
from .heuristic_analyzer import HeuristicCivicAnalyzer

logger = logging.getLogger("nagrikai.analyzer.ollama")

class OllamaGrievanceAnalyzer(BaseGrievanceAnalyzer):
    """
    Local Ollama LLM Analyzer for sovereign, on-device grievance categorization,
    priority assignment, and entity extraction.
    Automatically delegates to HeuristicCivicAnalyzer on connection failure.
    """

    def __init__(self, base_url: Optional[str] = None, model: Optional[str] = None):
        self.base_url = base_url or settings.OLLAMA_BASE_URL
        self.model = model or settings.OLLAMA_TEXT_MODEL
        self.fallback = HeuristicCivicAnalyzer()

    def analyze(self, input_data: GrievanceAnalysisInput) -> GrievanceAnalysisOutput:
        prompt = (
            "You are an expert civic intelligence officer for Maharashtra municipal corporations (PMC/BMC). "
            "Analyze this public citizen grievance and output ONLY valid JSON matching this schema:\n"
            "{\n"
            '  "category": "Road Infrastructure & Public Safety" | "Water Supply & Sewerage" | "Solid Waste Management" | "Electricity & Street Lighting" | "Public Health & Sanitation",\n'
            '  "subcategory": "string (specific issue)",\n'
            '  "issue": "string (concise headline)",\n'
            '  "summary": "string (clear 2-sentence administrative summary in English)",\n'
            '  "department": "string (responsible department name)",\n'
            '  "jurisdiction": "string (ward or zone authority)",\n'
            '  "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",\n'
            '  "duration": "string (e.g. Ongoing 48 hours)",\n'
            '  "affected_population": number (integer estimate),\n'
            '  "entities": [{"name": "string", "type": "LOCATION" | "LANDMARK" | "WARD" | "HAZARD"}],\n'
            '  "recommended_action": "string (field operative SOP directive)",\n'
            '  "recommendation_rationale": "string (technical justification)",\n'
            '  "confidence": number (float between 70.0 and 99.0),\n'
            '  "severity_score": number (float 1.0 to 10.0)\n'
            "}\n\n"
            f"Complaint Text: {input_data.complaint_text}\n"
            f"Language: {input_data.language}\n"
            f"Location Context: {input_data.location}\n"
            f"Evidence Analysis: {input_data.evidence_analysis}\n"
        )

        req_payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "format": "json",
            "options": {
                "temperature": 0.2,
                "top_p": 0.9,
            }
        }

        try:
            req = urllib.request.Request(
                f"{self.base_url}/api/generate",
                data=json.dumps(req_payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )

            with urllib.request.urlopen(req, timeout=3.5) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode("utf-8"))
                    raw_text = data.get("response", "{}")
                    parsed = json.loads(raw_text)

                    # Validate entities
                    raw_entities = parsed.get("entities", [])
                    entities = []
                    for e in raw_entities:
                        if isinstance(e, dict) and "name" in e:
                            entities.append(CivicEntity(name=str(e["name"]), type=str(e.get("type", "LOCATION"))))
                        elif isinstance(e, str):
                            entities.append(CivicEntity(name=e, type="LOCATION"))

                    priority = parsed.get("priority", "MEDIUM")
                    if priority not in ("CRITICAL", "HIGH", "MEDIUM", "LOW"):
                        priority = "MEDIUM"

                    confidence = float(parsed.get("confidence", 92.0))
                    confidence = max(50.0, min(99.0, confidence))

                    severity = float(parsed.get("severity_score", 6.0))
                    severity = max(1.0, min(10.0, severity))

                    return GrievanceAnalysisOutput(
                        category=parsed.get("category", "General Municipal Concern"),
                        subcategory=parsed.get("subcategory", "Unclassified Issue"),
                        issue=parsed.get("issue", input_data.complaint_text[:60]),
                        summary=parsed.get("summary", "Automated analysis completed by local LLM."),
                        department=parsed.get("department", "Municipal Public Services"),
                        jurisdiction=parsed.get("jurisdiction", "Local Municipal Ward"),
                        priority=priority,
                        duration=parsed.get("duration", "Reported recently"),
                        affected_population=int(parsed.get("affected_population", 500)),
                        entities=entities,
                        recommended_action=parsed.get("recommended_action", "Dispatch zonal officer for site inspection."),
                        recommendation_rationale=parsed.get("recommendation_rationale", "LLM-synthesized triage evaluation."),
                        confidence=confidence,
                        severity_score=severity,
                        model_name=f"ollama/{self.model}",
                        is_fallback=False
                    )
        except Exception as err:
            logger.info(f"Ollama local LLM unavailable ({err}). Executing Safe Heuristic Fallback Engine...")

        # Graceful fallback to deterministic heuristic analyzer
        return self.fallback.analyze(input_data)
