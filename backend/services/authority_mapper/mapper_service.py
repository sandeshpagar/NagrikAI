import logging
from typing import Optional, Dict, Any, List
from datetime import datetime

from .base import (
    AuthorityContact,
    EscalationTier,
    AuthorityResolutionInput,
    AuthorityResolutionOutput,
    BaseAuthorityMapper
)
from .seed_data import PMC_AUTHORITY_MAPPINGS, FALLBACK_AUTHORITY_RESOLUTION
from services.supabase_client import get_supabase
from services.audit import record_audit_event

logger = logging.getLogger("nagrikai.authority_mapper")

class AuthorityMapperService(BaseAuthorityMapper):
    """
    Production-grade Authority Mapping and Statutory Escalation Resolution Service.
    Resolves jurisdiction + category + department -> responsible authority + escalation chain.
    """

    def __init__(self, mappings: Optional[List[Dict[str, Any]]] = None):
        self.mappings = mappings or PMC_AUTHORITY_MAPPINGS

    def map_authority(
        self,
        ward: Optional[str] = None,
        category: Optional[str] = None,
        department: Optional[str] = None,
        jurisdiction: Optional[str] = None,
        grievance_id: Optional[str] = None,
        **kwargs
    ) -> AuthorityResolutionOutput:
        """
        Backward-compatible and developer-friendly alias for resolve().
        Accepts ward, category, jurisdiction, department directly as keywords.
        """
        j_input = jurisdiction or ward
        inp = AuthorityResolutionInput(
            jurisdiction=j_input,
            category=category,
            department=department,
            grievance_id=grievance_id
        )
        return self.resolve(inp)

    def resolve(self, req: AuthorityResolutionInput) -> AuthorityResolutionOutput:
        """
        Resolves authority and escalation hierarchy from provided criteria or grievance data.
        Never drops unmapped complaints; falls back to PMC Apex Central Grievance Cell.
        """
        jurisdiction_input = (req.jurisdiction or "").strip().lower()
        category_input = (req.category or "").strip().lower()
        dept_input = (req.department or "").strip().lower()

        # If grievance_id is passed and inputs are blank, query Supabase for context
        if req.grievance_id and not (jurisdiction_input and category_input):
            grievance_data = self._fetch_grievance(req.grievance_id)
            if grievance_data:
                jurisdiction_input = (grievance_data.get("address") or grievance_data.get("jurisdiction_text") or "").strip().lower()
                category_input = (grievance_data.get("category") or "").strip().lower()

        best_match: Optional[Dict[str, Any]] = None
        highest_score = 0

        for rule in self.mappings:
            score = 0
            # 1. Evaluate jurisdiction match
            for jk in rule.get("jurisdiction_keywords", []):
                if jk.lower() in jurisdiction_input:
                    score += 5
                    break

            # 2. Evaluate category match
            for ck in rule.get("category_keywords", []):
                if ck.lower() in category_input:
                    score += 5
                    break

            # 3. Evaluate department code or name match if provided
            dept_code = rule.get("department_code", "").lower()
            dept_name = rule.get("department_name", "").lower()
            if dept_input and (dept_input in dept_code or dept_input in dept_name or dept_code in dept_input):
                score += 3

            if score > highest_score:
                highest_score = score
                best_match = rule

        # Require a minimum score threshold (at least matching category or jurisdiction)
        if best_match and highest_score >= 5:
            authority = AuthorityContact(**best_match["responsible_authority"])
            tiers = [EscalationTier(**t) for t in best_match["escalation_chain"]]
            
            logger.info(
                f"[AUTHORITY MAPPER] Matched rule {best_match['rule_id']} for "
                f"jurisdiction='{req.jurisdiction}', category='{req.category}' -> {authority.name}"
            )

            return AuthorityResolutionOutput(
                jurisdiction=best_match.get("jurisdiction_name", req.jurisdiction or "Pune Municipal Jurisdiction"),
                category=req.category or "Civic Grievance",
                department=best_match.get("department_name", "Municipal Administration"),
                responsible_authority=authority,
                escalation_chain=tiers,
                is_fallback=False,
                mapping_rule_id=best_match["rule_id"],
                resolution_timestamp=datetime.utcnow().isoformat() + "Z"
            )

        # Fallback to Apex Central Redressal Cell
        logger.warning(
            f"[AUTHORITY MAPPER] No specific rule matched for jurisdiction='{req.jurisdiction}', "
            f"category='{req.category}'. Engaging PMC Apex Central Grievance Redressal fallback."
        )

        fb = FALLBACK_AUTHORITY_RESOLUTION
        fallback_authority = AuthorityContact(**fb["responsible_authority"])
        fallback_tiers = [EscalationTier(**t) for t in fb["escalation_chain"]]

        return AuthorityResolutionOutput(
            jurisdiction=req.jurisdiction or fb["jurisdiction_name"],
            category=req.category or "Unclassified Civic Issue",
            department=fb["department_name"],
            responsible_authority=fallback_authority,
            escalation_chain=fallback_tiers,
            is_fallback=True,
            mapping_rule_id=fb["rule_id"],
            resolution_timestamp=datetime.utcnow().isoformat() + "Z"
        )

    def assign_to_grievance(
        self,
        grievance_id: str,
        resolved: AuthorityResolutionOutput,
        actor_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Persists authority assignment to Supabase public.grievances and records an immutable audit log.
        """
        supabase = get_supabase()
        if not supabase:
            logger.info(
                f"[AUTHORITY ASSIGN LOCAL] Assigned grievance {grievance_id} to "
                f"{resolved.responsible_authority.name} ({resolved.mapping_rule_id})"
            )
            return {
                "grievance_id": grievance_id,
                "assigned": True,
                "responsible_authority": resolved.responsible_authority.dict(),
                "escalation_chain": [t.dict() for t in resolved.escalation_chain],
                "is_fallback": resolved.is_fallback,
                "mapping_rule_id": resolved.mapping_rule_id
            }

        try:
            # Update grievance record
            update_payload = {
                "authority_id": resolved.responsible_authority.id,
                "status": "ASSIGNED",
                "updated_at": datetime.utcnow().isoformat()
            }
            res = supabase.table("grievances").update(update_payload).eq("id", grievance_id).execute()

            # Record statutory audit log entry
            record_audit_event(
                supabase_client=supabase,
                action="AUTHORITY_ASSIGNED",
                details=(
                    f"Assigned grievance {grievance_id} to {resolved.responsible_authority.name} "
                    f"({resolved.responsible_authority.designation}) via rule {resolved.mapping_rule_id}."
                    f"{' [FALLBACK ENGAGED]' if resolved.is_fallback else ''}"
                ),
                grievance_id=grievance_id,
                actor_type="SYSTEM",
                actor_name="NagrikAI Authority Dispatch Engine",
                metadata={
                    "authority": resolved.responsible_authority.dict(),
                    "escalation_chain": [t.dict() for t in resolved.escalation_chain],
                    "is_fallback": resolved.is_fallback,
                    "mapping_rule_id": resolved.mapping_rule_id,
                    "actor_id": actor_id
                }
            )

            return {
                "grievance_id": grievance_id,
                "assigned": True,
                "data": res.data,
                "responsible_authority": resolved.responsible_authority.dict(),
                "escalation_chain": [t.dict() for t in resolved.escalation_chain],
                "is_fallback": resolved.is_fallback,
                "mapping_rule_id": resolved.mapping_rule_id
            }
        except Exception as e:
            logger.error(f"Failed to assign authority in Supabase for grievance {grievance_id}: {e}")
            raise e

    def get_configured_mappings(self) -> List[Dict[str, Any]]:
        """
        Returns all active mapping rules and the fallback configuration.
        """
        return [
            {
                "rule_id": r["rule_id"],
                "department_code": r["department_code"],
                "department_name": r["department_name"],
                "jurisdiction_name": r["jurisdiction_name"],
                "jurisdiction_keywords": r["jurisdiction_keywords"],
                "category_keywords": r["category_keywords"],
                "responsible_authority": r["responsible_authority"],
                "escalation_tiers_count": len(r["escalation_chain"])
            }
            for r in self.mappings
        ]

    def _fetch_grievance(self, grievance_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetches basic grievance details from Supabase if available.
        """
        supabase = get_supabase()
        if not supabase:
            return None
        try:
            res = supabase.table("grievances").select("id, address, category, title").eq("id", grievance_id).maybe_single().execute()
            return res.data if res else None
        except Exception:
            return None

# Singleton instance
authority_mapper_service = AuthorityMapperService()
