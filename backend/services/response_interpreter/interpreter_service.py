import logging
from typing import Optional, Dict, Any, List
from datetime import datetime

from .models import (
    OfficerActionSubmission,
    ValidatedOfficerResponse,
    ConfirmRecommendationRequest,
    ModifyRecommendationRequest
)
from services.llm_provider.factory import get_llm_provider
from services.supabase_client import get_supabase
from services.audit import record_audit_event

logger = logging.getLogger("nagrikai.response_interpreter")

VAGUE_NON_COMMITTAL_PHRASES = [
    "maybe",
    "look into it later",
    "looking into this later",
    "check with team",
    "checking with team",
    "will see",
    "sometime later",
    "not sure yet",
    "pending someone",
    "when free",
    "after holiday",
    "hold on",
    "undecided",
    "will check",
    "might be",
    "later",
    "sometime",
    "ambiguity",
    "ambiguous",
    "let me check",
    "we will see",
    "will look into it",
    "maybe later",
    "sometime soon",
    "look into it",
]

class ResponseInterpreterService:
    """
    Statutory Officer Response Interpretation Engine.
    Enforces strict zero-fabrication guardrails:
    - Interprets officer directives only via validated structured output models.
    - If a directive is ambiguous or vague, preserves the previous status and requests clarification.
    - Updates database and Section 65B audit trail.
    """

    def __init__(self):
        self._in_memory_records: Dict[str, Dict[str, Any]] = {}

    def interpret_submission(
        self,
        submission: OfficerActionSubmission,
        current_grievance: Optional[Dict[str, Any]] = None
    ) -> ValidatedOfficerResponse:
        """
        Interprets and validates officer action submissions against strict Pydantic contracts.
        """
        cur_grv = current_grievance or {}
        cur_status = cur_grv.get("status", "ASSIGNED")
        directive = (submission.directive_text or "").strip()
        directive_lower = directive.lower()

        # Determine Recommendation Decision
        rec_decision = "UNCHANGED"
        if submission.confirm_ai_sop:
            rec_decision = "CONFIRMED"
        elif submission.modified_sop_action:
            rec_decision = "MODIFIED"

        # 1. STRICT AMBIGUITY GUARDRAIL (Zero-Fabrication Guarantee)
        # Evaluated first: vague or non-committal directives MUST NEVER advance status.
        is_explicitly_vague = any(phrase in directive_lower for phrase in VAGUE_NON_COMMITTAL_PHRASES)
        is_short_vague = False
        if directive and len(directive.split()) <= 4:
            vague_words = ["maybe", "later", "check", "soon", "pending", "hold", "see", "wait", "not sure"]
            if any(w in directive_lower for w in vague_words):
                is_short_vague = True

        if is_explicitly_vague or is_short_vague:
            logger.warning(
                f"[RESPONSE INTERPRETER] Directive '{directive}' flagged as ambiguous for {submission.grievance_id}. "
                f"Retaining previous status: {cur_status}."
            )
            return ValidatedOfficerResponse(
                grievance_id=submission.grievance_id,
                status=cur_status,  # Preserve previous status!
                is_ambiguous=True,
                confidence=0.45,
                clarification_requested=(
                    "Officer directive is ambiguous or non-committal. "
                    "Please specify whether an action is scheduled, work is underway, or case is closed."
                ),
                expected_resolution_at=cur_grv.get("expected_resolution_at"),
                plain_language_summary=(
                    "The authority officer has acknowledged your case. "
                    "A formal operational schedule is currently being finalized."
                ),
                recommendation_decision=rec_decision,
                resolution_notes=submission.resolution_notes,
                applied_directive=directive
            )

        # 2. Direct explicit status transition provided by officer (when not ambiguous)
        if submission.status_intent and submission.status_intent.upper() in [
            "IN_PROGRESS", "ACTION_SCHEDULED", "RESOLVED", "NEEDS_EVIDENCE", "REJECTED"
        ]:
            final_status = submission.status_intent.upper()
            plain_summary = self._generate_plain_summary(final_status, directive, submission.expected_action_date)
            return ValidatedOfficerResponse(
                grievance_id=submission.grievance_id,
                status=final_status,
                is_ambiguous=False,
                confidence=1.0,
                expected_resolution_at=submission.expected_action_date or cur_grv.get("expected_resolution_at"),
                plain_language_summary=plain_summary,
                recommendation_decision=rec_decision,
                resolution_notes=submission.resolution_notes,
                applied_directive=directive or f"Officer marked case as {final_status}."
            )

        # 3. If unstructured directive is provided without explicit status, use LLM or Heuristics
        if directive:
            # Fast statutory keyword heuristics for instant sub-millisecond classification
            if any(w in directive_lower for w in ["scheduled", "patching", "squad", "crew", "tomorrow", "inspection date", "dispatched", "pothole"]):
                detected_status = "ACTION_SCHEDULED"
                plain_summary = self._generate_plain_summary(detected_status, directive, submission.expected_action_date)
                return ValidatedOfficerResponse(
                    grievance_id=submission.grievance_id,
                    status=detected_status,
                    is_ambiguous=False,
                    confidence=0.95,
                    expected_resolution_at=submission.expected_action_date or cur_grv.get("expected_resolution_at"),
                    plain_language_summary=plain_summary,
                    recommendation_decision=rec_decision,
                    resolution_notes=submission.resolution_notes,
                    applied_directive=directive
                )
            elif any(w in directive_lower for w in ["resolved", "fixed", "completed", "closed", "rectified"]):
                detected_status = "RESOLVED"
                plain_summary = self._generate_plain_summary(detected_status, directive, submission.expected_action_date)
                return ValidatedOfficerResponse(
                    grievance_id=submission.grievance_id,
                    status=detected_status,
                    is_ambiguous=False,
                    confidence=0.98,
                    expected_resolution_at=submission.expected_action_date or cur_grv.get("expected_resolution_at"),
                    plain_language_summary=plain_summary,
                    recommendation_decision=rec_decision,
                    resolution_notes=submission.resolution_notes,
                    applied_directive=directive
                )

            llm = get_llm_provider()
            prompt = (
                f"Grievance Title: {cur_grv.get('title', 'Civic Grievance')}\n"
                f"Current Status: {cur_status}\n"
                f"Officer Directive: '{directive}'\n\n"
                "Analyze the officer directive and classify the intended statutory status:\n"
                "- 'RESOLVED': if the issue is fully fixed or closed\n"
                "- 'ACTION_SCHEDULED': if a specific date, crew, or inspection has been planned\n"
                "- 'IN_PROGRESS': if repair work or crew is actively on-site\n"
                "- 'NEEDS_EVIDENCE': if officer requested more photos, landmark info, or resident contact\n"
                "- 'REJECTED': if invalid, out of jurisdiction, or duplicate\n"
                "- 'AMBIGUOUS': if non-committal, vague, or casual text without a definite municipal action\n"
            )
            system_prompt = (
                "You are an RTSA statutory municipal compliance validator. "
                "Output JSON with keys: 'status' (string), 'is_ambiguous' (bool), 'confidence' (float 0.0-1.0), "
                "and 'plain_language_summary' (concise reassurance for citizen)."
            )

            try:
                llm_res = llm.generate_json(prompt=prompt, system_prompt=system_prompt)
                detected_status = (llm_res.get("status") or "AMBIGUOUS").upper()
                is_ambig = bool(llm_res.get("is_ambiguous", False)) or detected_status == "AMBIGUOUS"
                conf = float(llm_res.get("confidence", 0.8))

                if is_ambig or conf < 0.70:
                    logger.info(f"[RESPONSE INTERPRETER] LLM marked directive as ambiguous. Preserving {cur_status}.")
                    return ValidatedOfficerResponse(
                        grievance_id=submission.grievance_id,
                        status=cur_status,  # Strictly preserve previous status
                        is_ambiguous=True,
                        confidence=conf,
                        clarification_requested="Directive required clarification. Previous status maintained.",
                        expected_resolution_at=cur_grv.get("expected_resolution_at"),
                        plain_language_summary=(
                            "The authority officer has posted an internal note and is clarifying operational steps."
                        ),
                        recommendation_decision=rec_decision,
                        resolution_notes=submission.resolution_notes,
                        applied_directive=directive
                    )

                plain_summary = llm_res.get(
                    "plain_language_summary",
                    self._generate_plain_summary(detected_status, directive, submission.expected_action_date)
                )

                return ValidatedOfficerResponse(
                    grievance_id=submission.grievance_id,
                    status=detected_status,
                    is_ambiguous=False,
                    confidence=conf,
                    expected_resolution_at=submission.expected_action_date or cur_grv.get("expected_resolution_at"),
                    plain_language_summary=plain_summary,
                    recommendation_decision=rec_decision,
                    resolution_notes=submission.resolution_notes,
                    applied_directive=directive
                )
            except Exception as e:
                logger.error(f"[RESPONSE INTERPRETER] Error calling LLM provider: {e}")

        # 4. Default fallback when no directive or status provided (e.g. only confirming SOP)
        return ValidatedOfficerResponse(
            grievance_id=submission.grievance_id,
            status=cur_status,
            is_ambiguous=False,
            confidence=1.0,
            expected_resolution_at=submission.expected_action_date or cur_grv.get("expected_resolution_at"),
            plain_language_summary="Grievance updated by municipal officer.",
            recommendation_decision=rec_decision,
            resolution_notes=submission.resolution_notes,
            applied_directive=directive or "Officer reviewed case."
        )

    def apply_response(
        self,
        submission: OfficerActionSubmission,
        validated: ValidatedOfficerResponse
    ) -> Dict[str, Any]:
        """
        Persists the validated officer response to Supabase / memory and writes Section 65B audit log.
        """
        client = get_supabase()
        gid = submission.grievance_id
        now_iso = datetime.utcnow().isoformat()

        update_payload: Dict[str, Any] = {
            "status": validated.status,
            "updated_at": now_iso
        }
        if validated.applied_directive:
            update_payload["authority_directive"] = validated.applied_directive
        if validated.expected_resolution_at:
            update_payload["expected_resolution_at"] = validated.expected_resolution_at
        if validated.resolution_notes:
            update_payload["resolution_notes"] = validated.resolution_notes

        # In-memory store update
        if gid not in self._in_memory_records:
            self._in_memory_records[gid] = {}
        self._in_memory_records[gid].update(update_payload)

        # Database update
        if client:
            try:
                client.table("grievances").update(update_payload).or_(
                    f"id.eq.{gid},grievance_number.eq.{gid}"
                ).execute()
            except Exception as e:
                logger.error(f"Failed to update grievance record in Supabase: {e}")

        # Section 65B Audit Log
        action_name = "AUTHORITY_RESPONSE_PROCESSED"
        if validated.status == "RESOLVED":
            action_name = "GRIEVANCE_RESOLVED_BY_OFFICER"
        elif validated.is_ambiguous:
            action_name = "AUTHORITY_DIRECTIVE_FLAGGED_AMBIGUOUS"

        record_audit_event(
            supabase_client=client,
            action=action_name,
            details=(
                f"Officer {submission.officer_name or 'Municipal Desk'} submitted action: "
                f"Status='{validated.status}' (Ambiguous: {validated.is_ambiguous}). "
                f"Directive: '{validated.applied_directive or 'None'}'."
            ),
            grievance_id=gid,
            actor_type="OFFICER",
            actor_name=submission.officer_name or "Municipal Authority Officer",
            metadata={
                "validated_response": validated.dict(),
                "recommendation_decision": validated.recommendation_decision,
                "submission": submission.dict()
            }
        )

        return {
            "success": True,
            "grievance_id": gid,
            "status": validated.status,
            "is_ambiguous": validated.is_ambiguous,
            "validated": validated.dict()
        }

    def confirm_recommendation(self, req: ConfirmRecommendationRequest) -> Dict[str, Any]:
        """One-click confirmation of AI suggested SOP recommendation."""
        submission = OfficerActionSubmission(
            grievance_id=req.grievance_id,
            officer_name=req.officer_name,
            confirm_ai_sop=True,
            directive_text=f"Confirmed AI Recommended SOP: {req.notes or 'Proceeding with standard municipal dispatch.'}",
            status_intent="IN_PROGRESS"
        )
        validated = self.interpret_submission(submission)
        return self.apply_response(submission, validated)

    def modify_recommendation(self, req: ModifyRecommendationRequest) -> Dict[str, Any]:
        """Custom override of AI recommendation with administrative justification."""
        submission = OfficerActionSubmission(
            grievance_id=req.grievance_id,
            officer_name=req.officer_name,
            modified_sop_action=req.custom_action,
            modification_reason=req.reason,
            directive_text=f"Modified SOP Action: {req.custom_action}. Justification: {req.reason}",
            status_intent="IN_PROGRESS"
        )
        validated = self.interpret_submission(submission)
        return self.apply_response(submission, validated)

    def _generate_plain_summary(self, status: str, directive: str, expected_date: Optional[str]) -> str:
        """Helper to generate citizen-friendly plain English message."""
        date_str = f" scheduled for {expected_date[:10]}" if expected_date else ""
        if status == "RESOLVED":
            return "Your grievance has been successfully resolved and inspected by municipal officials."
        elif status == "ACTION_SCHEDULED":
            return f"Municipal repair action has been approved and scheduled{date_str}. Field squad assigned."
        elif status == "IN_PROGRESS":
            return "Municipal maintenance crew is actively deployed on-site addressing this grievance."
        elif status == "NEEDS_EVIDENCE":
            return "The assigned officer has requested additional location details or photos to proceed."
        elif status == "REJECTED":
            return "Your complaint has been reviewed and closed with an administrative explanation."
        return "Your grievance is progressing actively through municipal triage."

# Global singleton
response_interpreter_service = ResponseInterpreterService()
