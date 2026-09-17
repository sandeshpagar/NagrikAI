import logging
from typing import Dict, Any, Optional

from config import settings
from services.supabase_client import get_supabase
from services.audit import record_audit_event
from .base import (
    BaseGrievanceAnalyzer,
    GrievanceAnalysisInput,
    GrievanceAnalysisOutput,
)
from .heuristic_analyzer import HeuristicCivicAnalyzer
from .ollama_analyzer import OllamaGrievanceAnalyzer
from .gemini_analyzer import GeminiGrievanceAnalyzer

logger = logging.getLogger("nagrikai.analyzer.service")

class GrievanceAnalysisService:
    """
    Master Service orchestrating AI Grievance Analysis.
    Ensures safe execution, strict validation, and transactional DB persistence.
    "Never let the LLM directly mutate the database" - all writes occur here.
    """

    def __init__(self):
        if settings.AI_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
            self.primary_analyzer: BaseGrievanceAnalyzer = GeminiGrievanceAnalyzer()
        elif settings.AI_PROVIDER == "ollama":
            self.primary_analyzer = OllamaGrievanceAnalyzer()
        else:
            self.primary_analyzer = HeuristicCivicAnalyzer()

    def analyze_text(
        self,
        complaint_text: str,
        language: str = "English",
        location: Optional[Dict[str, Any]] = None,
        evidence_analysis: Optional[Dict[str, Any]] = None,
    ) -> GrievanceAnalysisOutput:
        """
        Runs stateless analysis on raw complaint data without DB mutation.
        """
        input_data = GrievanceAnalysisInput(
            complaint_text=complaint_text,
            language=language,
            location=location or {},
            evidence_analysis=evidence_analysis or {},
        )
        return self.primary_analyzer.analyze(input_data)

    def analyze_and_persist(
        self,
        grievance_id: str,
        actor_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Loads a grievance from Supabase, executes AI analysis, persists output
        to public.ai_analyses, updates public.grievances, and logs an immutable audit event.
        """
        supabase = get_supabase()
        if not supabase:
            raise RuntimeError("Database connection unavailable for AI Analysis persistence")

        # 1. Fetch grievance record
        res = supabase.table("grievances").select("*, evidence(*)").eq("id", grievance_id).execute()
        if not res.data or len(res.data) == 0:
            # Also try matching by grievance_number if passed
            res = supabase.table("grievances").select("*, evidence(*)").eq("grievance_number", grievance_id).execute()
            if not res.data or len(res.data) == 0:
                raise ValueError(f"Grievance not found: {grievance_id}")

        grievance = res.data[0]
        actual_id = grievance["id"]

        # Aggregate evidence analysis summary if present
        evidence_list = grievance.get("evidence") or []
        primary_evidence = evidence_list[0] if len(evidence_list) > 0 else {}

        # 2. Prepare analysis input
        full_text = f"{grievance.get('title', '')}. {grievance.get('description', '')}"
        input_data = GrievanceAnalysisInput(
            complaint_text=full_text,
            language=grievance.get("language") or "English",
            location={
                "ward": grievance.get("address", "").split(",")[-1].strip() or "Ward 12",
                "address": grievance.get("address") or "Pune",
                "lat": float(grievance.get("latitude") or 18.4965),
                "lng": float(grievance.get("longitude") or 73.8312),
            },
            evidence_analysis={
                "verification_status": primary_evidence.get("verification_status", "NEEDS_VERIFICATION"),
                "risk_score": float(primary_evidence.get("risk_score") or 0.0),
            }
        )

        # 3. Execute analysis
        analysis_result: GrievanceAnalysisOutput = self.primary_analyzer.analyze(input_data)

        # 4. Safely persist to public.ai_analyses
        ai_record = {
            "grievance_id": actual_id,
            "model_name": analysis_result.model_name,
            "category": analysis_result.category,
            "subcategory": analysis_result.subcategory,
            "severity_score": analysis_result.severity_score,
            "severity_description": f"{analysis_result.priority} priority municipal risk index ({analysis_result.severity_score}/10.0)",
            "summary": analysis_result.summary,
            "affected_population_estimate": f"~{analysis_result.affected_population:,} residents",
            "duration_text": analysis_result.duration,
            "jurisdiction_text": analysis_result.jurisdiction,
            "priority": analysis_result.priority,
            "entities": [e.dict() for e in analysis_result.entities],
            "recommended_action": analysis_result.recommended_action,
            "recommendation_rationale": analysis_result.recommendation_rationale,
            "confidence": analysis_result.confidence,
            "raw_output": analysis_result.dict(),
        }

        inserted_analysis = None
        try:
            insert_res = supabase.table("ai_analyses").insert(ai_record).execute()
            if insert_res.data and len(insert_res.data) > 0:
                inserted_analysis = insert_res.data[0]
        except Exception as insert_err:
            logger.error(f"Failed to insert ai_analysis: {insert_err}")
            raise insert_err

        # 5. Update grievance record
        try:
            update_payload = {
                "category": analysis_result.category,
                "subcategory": analysis_result.subcategory,
                "priority": analysis_result.priority,
                "affected_population": analysis_result.affected_population,
                "duration_text": analysis_result.duration,
            }
            # Transition status from SUBMITTED to ASSIGNED or EVIDENCE_REVIEW
            if grievance.get("status") in ("SUBMITTED", "AI_ANALYZING"):
                update_payload["status"] = "ASSIGNED"

            supabase.table("grievances").update(update_payload).eq("id", actual_id).execute()
        except Exception as update_err:
            logger.warning(f"Could not update grievance metadata: {update_err}")

        # 6. Immutable audit log entry
        try:
            record_audit_event(
                grievance_id=actual_id,
                action="AI_ANALYSIS_COMPLETED",
                actor_id=actor_id,
                actor_role="SYSTEM_ADMIN",
                description=(
                    f"AI analysis completed via {analysis_result.model_name}. "
                    f"Classified as '{analysis_result.category}' with {analysis_result.priority} priority (Confidence: {analysis_result.confidence}%)."
                ),
                metadata={
                    "model": analysis_result.model_name,
                    "confidence": analysis_result.confidence,
                    "priority": analysis_result.priority,
                    "category": analysis_result.category,
                    "is_fallback": analysis_result.is_fallback,
                }
            )
        except Exception as audit_err:
            logger.warning(f"Audit log failed: {audit_err}")

        return {
            "success": True,
            "grievance_id": actual_id,
            "analysis": analysis_result.dict(),
            "persisted_record": inserted_analysis or ai_record
        }

# Global singleton
analysis_service = GrievanceAnalysisService()
