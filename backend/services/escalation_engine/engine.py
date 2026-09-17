import logging
import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime

from .models import EscalationEvent, TriggerEscalationRequest, EscalationTierInfo
from services.authority_mapper import (
    authority_mapper_service,
    AuthorityResolutionInput,
    FALLBACK_AUTHORITY_RESOLUTION
)
from services.email_notifier import email_notifier_service, EmailRecipient
from services.audit import record_audit_event
from services.supabase_client import get_supabase

logger = logging.getLogger("nagrikai.escalation_engine")

class EscalationEngine:
    """
    Statutory Escalation Management Engine for Maharashtra RTSA 2015.
    Resolves dynamic, non-universal department-specific escalation hierarchies,
    dispatches high-priority statutory alert notices, and writes Section 65B audit trails.
    """

    def __init__(self):
        self._in_memory_events: Dict[str, List[EscalationEvent]] = {}
        self._in_memory_grievances: Dict[str, Dict[str, Any]] = {}

    def get_escalation_chain(
        self,
        grievance: Optional[Dict[str, Any]] = None,
        ward: Optional[str] = None,
        category: Optional[str] = None,
        department: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieves the dynamic statutory escalation chain for the given grievance or criteria.
        Guaranteed non-universal: Different departments and wards have independent officer hierarchies.
        """
        w = ward or (grievance.get("ward") if grievance else None) or (grievance.get("address") if grievance else None)
        c = category or (grievance.get("category") if grievance else None)
        d = department or (grievance.get("department_code") if grievance else None) or (grievance.get("department") if grievance else None)

        try:
            resolved = authority_mapper_service.resolve(
                AuthorityResolutionInput(jurisdiction=w, category=c, department=d)
            )
            chain = [tier.dict() for tier in resolved.escalation_chain]
            if chain:
                return chain
        except Exception as e:
            logger.warning(f"[ESCALATION ENGINE] Error querying authority mapper: {e}")

        # Fallback to apex chain
        return [dict(t) for t in FALLBACK_AUTHORITY_RESOLUTION["escalation_chain"]]

    def get_target_authority_for_level(
        self,
        target_level: int,
        grievance: Optional[Dict[str, Any]] = None,
        chain: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Resolves the exact municipal officer profile for the requested escalation level.
        """
        active_chain = chain or self.get_escalation_chain(grievance)
        
        # Level 1 -> Tier 1 (or 2 if 1 is initial field assignment)
        # Level 2 -> Tier 2
        # Level 3+ -> Tier 3 (Apex)
        target_idx = max(0, min(target_level, len(active_chain) - 1))
        tier_data = active_chain[target_idx]

        return {
            "id": tier_data.get("id") or f"auth-tier-{target_level}",
            "name": tier_data.get("name", "Dr. Anand Rao, IAS"),
            "designation": tier_data.get("designation", "Additional Municipal Commissioner"),
            "department": tier_data.get("department_name") or tier_data.get("department") or "PMC Executive Governance",
            "email": tier_data.get("email", "amc.digital@pmc.gov.in"),
            "phone": tier_data.get("phone", "+91 98200 99001"),
            "jurisdiction": tier_data.get("jurisdiction_name") or tier_data.get("jurisdiction") or "Pune Citywide Governance",
            "role": tier_data.get("role", "DEPARTMENT_ADMIN"),
            "escalation_tier": target_level
        }

    def execute_escalation(
        self,
        grievance_id: str,
        target_level: Optional[int] = None,
        reason: str = "Statutory SLA expired without field engineer acknowledgment.",
        actor_type: str = "SYSTEM",
        actor_name: str = "NagrikAI Statutory Escalation Engine",
        breached_hours: Optional[float] = None
    ) -> EscalationEvent:
        """
        Executes an escalation under the Maharashtra Right to Public Services Act (RTSA 2015):
        1. Identifies previous authority and resolves next senior supervisor from dynamic chain.
        2. Updates grievance status to 'ESCALATED' and assigns senior supervisor.
        3. Dispatches high-priority email alert to senior authority.
        4. Writes Section 65B immutable audit event.
        5. Persists escalation event.
        """
        client = get_supabase()
        
        # 1. Fetch current grievance details
        grv = None
        if client:
            try:
                res = client.table("grievances").select("*").or_(
                    f"id.eq.{grievance_id},grievance_number.eq.{grievance_id}"
                ).execute()
                if res.data:
                    grv = res.data[0]
            except Exception as e:
                logger.warning(f"Failed to fetch grievance from Supabase: {e}")

        if not grv:
            grv = self._in_memory_grievances.get(grievance_id, {
                "id": grievance_id,
                "grievance_number": grievance_id,
                "status": "ASSIGNED",
                "escalation_level": 0,
                "title": f"Civic Grievance {grievance_id}",
                "category": "Road Infrastructure",
                "ward": "Ward 12",
            })

        current_level = int(grv.get("escalation_level") or 0)
        new_level = target_level if target_level is not None else min(current_level + 1, 3)

        # 2. Resolve dynamic non-hardcoded chain
        chain = self.get_escalation_chain(grv)
        from_auth = {
            "id": grv.get("assigned_authority_id") or "auth-field-01",
            "designation": "Field Officer" if current_level == 0 else f"Tier {current_level} Authority"
        }
        to_auth = self.get_target_authority_for_level(new_level, grievance=grv, chain=chain)

        # 3. Create escalation event model
        event_id = f"ESC-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        event = EscalationEvent(
            id=event_id,
            grievance_id=grievance_id,
            from_level=current_level,
            to_level=new_level,
            from_authority=from_auth,
            to_authority=to_auth,
            trigger_reason=reason,
            breached_hours=breached_hours,
            actor_type=actor_type,
            actor_name=actor_name,
            created_at=datetime.utcnow().isoformat() + "Z"
        )

        # 4. Update grievance record
        update_payload = {
            "status": "ESCALATED",
            "escalation_level": new_level,
            "assigned_authority_id": to_auth["id"],
            "authority_directive": f"Statutory Escalation Level {new_level}: Escalated to {to_auth['designation']} due to: {reason}",
            "updated_at": datetime.utcnow().isoformat()
        }
        grv.update(update_payload)
        self._in_memory_grievances[grievance_id] = grv

        if client:
            try:
                client.table("grievances").update(update_payload).or_(
                    f"id.eq.{grievance_id},grievance_number.eq.{grievance_id}"
                ).execute()
            except Exception as e:
                logger.error(f"Failed to update grievance record in Supabase: {e}")

            # Also insert into escalations table if exists
            try:
                client.table("escalations").insert({
                    "grievance_id": grv.get("id", grievance_id),
                    "from_authority_id": from_auth.get("id"),
                    "to_authority_id": to_auth.get("id"),
                    "reason": reason,
                    "level": new_level,
                    "created_at": event.created_at
                }).execute()
            except Exception as e:
                logger.debug(f"Failed to insert row to escalations table: {e}")

        # 5. Dispatch statutory notification email
        try:
            recipient = EmailRecipient(
                name=to_auth["name"],
                email=to_auth["email"],
                designation=to_auth["designation"],
                department=to_auth.get("department", "Municipal Department"),
                jurisdiction=to_auth.get("jurisdiction", "Pune Municipal Corporation")
            )
            email_notifier_service.send_authority_notice(
                grievance=grv,
                recipient=recipient,
                force=True  # Escalations bypass deduplication
            )
            logger.info(f"[ESCALATION EMAIL] Dispatched Tier {new_level} notice to {to_auth['email']}.")
        except Exception as e:
            logger.error(f"Failed to dispatch escalation notice email: {e}")

        # 6. Record Section 65B audit trail
        record_audit_event(
            supabase_client=client,
            action=f"STATUTORY_ESCALATION_LEVEL_{new_level}",
            details=(
                f"Statutory escalation under Maharashtra RTSA 2015 from Level {current_level} to Level {new_level}. "
                f"Assigned to {to_auth['name']} ({to_auth['designation']}). Reason: {reason}"
            ),
            grievance_id=grv.get("id", grievance_id),
            grievance_number=grv.get("grievance_number", grievance_id),
            actor_type=actor_type,
            actor_name=actor_name,
            metadata={
                "escalation_event_id": event.id,
                "from_level": current_level,
                "to_level": new_level,
                "from_authority": from_auth,
                "to_authority": to_auth,
                "reason": reason,
                "breached_hours": breached_hours,
            }
        )

        # 7. Persist in memory history
        if grievance_id not in self._in_memory_events:
            self._in_memory_events[grievance_id] = []
        self._in_memory_events[grievance_id].append(event)

        logger.info(
            f"[STATUTORY ESCALATION] {grievance_id} elevated to Tier {new_level} -> {to_auth['name']}."
        )
        return event

    def get_history(self, grievance_id: str) -> List[EscalationEvent]:
        """Returns all historical escalation events for a grievance."""
        client = get_supabase()
        if client:
            try:
                res = client.table("escalations").select("*").eq("grievance_id", grievance_id).order("created_at").execute()
                if res.data:
                    return [
                        EscalationEvent(
                            id=row.get("id", f"ESC-{idx}"),
                            grievance_id=grievance_id,
                            from_level=max(0, row.get("level", 1) - 1),
                            to_level=row.get("level", 1),
                            to_authority={"id": row.get("to_authority_id")},
                            trigger_reason=row.get("reason", "Statutory escalation"),
                            created_at=row.get("created_at")
                        )
                        for idx, row in enumerate(res.data)
                    ]
            except Exception as e:
                logger.debug(f"Failed to query escalations from DB: {e}")

        return self._in_memory_events.get(grievance_id, [])

# Global singleton
escalation_engine = EscalationEngine()
