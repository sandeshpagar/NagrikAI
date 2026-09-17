import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta, timezone

from .models import SlaRule, SlaEvaluationResult, SlaRuleCreate, SlaRuleUpdate
from .seed_rules import PMC_DEFAULT_SLA_RULES
from services.supabase_client import get_supabase

logger = logging.getLogger("nagrikai.sla_engine")

class SlaEngine:
    """
    Statutory SLA Management Engine for NagrikAI Civic Grievance Platform.
    Compliant with the Maharashtra Right to Public Services Act (RTSA 2015).
    Provides dual-mode persistence: In-memory live cache + live Supabase synchronization.
    """

    def __init__(self, rules: Optional[List[SlaRule]] = None):
        self._rules: Dict[str, SlaRule] = {}
        for r in (rules or PMC_DEFAULT_SLA_RULES):
            self._rules[r.rule_id] = r
        self._load_from_db()

    def _load_from_db(self):
        """Attempts to sync persistent rules from Supabase."""
        client = get_supabase()
        if not client:
            return
        try:
            res = client.table("sla_rules").select("*").execute()
            if res.data:
                for row in res.data:
                    rule = SlaRule(
                        rule_id=row.get("rule_id", row.get("id")),
                        department_code=row.get("department_code"),
                        category=row.get("category"),
                        priority=row.get("priority"),
                        acknowledgement_hours=row.get("acknowledgement_hours", 12),
                        resolution_hours=row.get("resolution_hours", 48),
                        reminder_before_hours=row.get("reminder_before_hours", 2),
                        reminder_after_hours=row.get("reminder_after_hours", 4),
                        escalation_after_hours=row.get("escalation_after_hours", 4),
                        max_reminders=row.get("max_reminders", 3),
                        is_active=row.get("active", row.get("is_active", True)),
                        description=row.get("description")
                    )
                    self._rules[rule.rule_id] = rule
                logger.info(f"[SLA ENGINE] Synchronized {len(res.data)} rules from Supabase.")
        except Exception as e:
            logger.debug(f"[SLA ENGINE] Supabase sla_rules table not ready: {e}. Using seed rules.")

    def get_rules(self, active_only: bool = False) -> List[SlaRule]:
        """Returns all configured SLA rules."""
        rules = list(self._rules.values())
        if active_only:
            rules = [r for r in rules if r.is_active]
        return rules

    def get_rule(self, rule_id: str) -> Optional[SlaRule]:
        return self._rules.get(rule_id)

    def save_rule(self, payload: SlaRuleCreate) -> SlaRule:
        """Adds or updates a configurable SLA rule."""
        rule_id = payload.rule_id or f"SLA-CUSTOM-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        rule = SlaRule(
            rule_id=rule_id,
            department_code=payload.department_code,
            category=payload.category,
            priority=payload.priority,
            acknowledgement_hours=payload.acknowledgement_hours,
            resolution_hours=payload.resolution_hours,
            reminder_before_hours=payload.reminder_before_hours,
            reminder_after_hours=payload.reminder_after_hours,
            escalation_after_hours=payload.escalation_after_hours,
            max_reminders=payload.max_reminders,
            is_active=payload.is_active,
            description=payload.description,
        )
        self._rules[rule_id] = rule
        
        # Persist to Supabase if available
        client = get_supabase()
        if client:
            try:
                client.table("sla_rules").upsert(rule.dict()).execute()
            except Exception as e:
                logger.debug(f"Failed to upsert rule to DB: {e}")
                
        return rule

    def match_rule(
        self,
        department_code: Optional[str] = None,
        category: Optional[str] = None,
        priority: Optional[str] = None
    ) -> SlaRule:
        """
        Matches the most specific active SLA rule for a grievance.
        Priority:
        1. Exact Dept + Category + Priority
        2. Dept + Priority
        3. Category + Priority
        4. Priority only
        5. Fallback Default
        """
        dept_norm = (department_code or "").strip().upper()
        cat_norm = (category or "").strip().lower()
        pri_norm = (priority or "MEDIUM").strip().upper()

        best_rule: Optional[SlaRule] = None
        best_score = -1

        for r in self._rules.values():
            if not r.is_active:
                continue
            
            score = 0
            # Check department match
            if r.department_code:
                if r.department_code.strip().upper() == dept_norm:
                    score += 10
                else:
                    continue  # Conflicting department filter

            # Check category match
            if r.category:
                if r.category.strip().lower() in cat_norm or cat_norm in r.category.strip().lower():
                    score += 8
                else:
                    continue  # Conflicting category filter

            # Check priority match
            if r.priority:
                if r.priority.strip().upper() == pri_norm:
                    score += 5
                else:
                    continue  # Conflicting priority filter

            if score > best_score:
                best_score = score
                best_rule = r

        if best_rule:
            return best_rule

        # Fallback to apex default
        return self._rules.get("SLA-PMC-APEX-FALLBACK") or PMC_DEFAULT_SLA_RULES[-1]

    def calculate_deadlines(
        self,
        created_at: Optional[str] = None,
        priority: Optional[str] = "MEDIUM",
        department_code: Optional[str] = None,
        category: Optional[str] = None
    ) -> Dict[str, Any]:
        """Calculates statutory ack and resolution deadlines."""
        rule = self.match_rule(department_code=department_code, category=category, priority=priority)
        
        now = datetime.now(timezone.utc)
        start_dt = now
        if created_at:
            try:
                start_dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            except Exception:
                start_dt = now

        ack_deadline = start_dt + timedelta(hours=rule.acknowledgement_hours)
        res_deadline = start_dt + timedelta(hours=rule.resolution_hours)

        return {
            "rule": rule,
            "start_time": start_dt.isoformat(),
            "acknowledgement_deadline": ack_deadline.isoformat(),
            "resolution_deadline": res_deadline.isoformat(),
            "acknowledgement_hours": rule.acknowledgement_hours,
            "resolution_hours": rule.resolution_hours,
        }

    def evaluate_grievance(self, grievance: Dict[str, Any]) -> SlaEvaluationResult:
        """
        Performs real-time statutory evaluation of a grievance:
        - Checks acknowledgement SLA (MET, PENDING, BREACHED)
        - Checks resolution SLA (MET, PENDING, OVERDUE)
        - Formats remaining time or overdue delta
        - Evaluates urgency level (NORMAL, WARNING_SOON, BREACHED, CRITICAL_ESCALATION)
        - Determines whether a reminder or statutory escalation is recommended
        """
        gid = grievance.get("id") or grievance.get("grievance_number") or "GRV-UNKNOWN"
        priority = (grievance.get("priority") or "MEDIUM").upper()
        department = grievance.get("department_code") or grievance.get("department")
        category = grievance.get("category")
        status = (grievance.get("status") or "SUBMITTED").upper()
        followup_count = int(grievance.get("followup_count") or 0)
        current_tier = int(grievance.get("escalation_level") or 0)

        created_at_str = grievance.get("created_at") or datetime.now(timezone.utc).isoformat()
        now = datetime.now(timezone.utc)
        
        try:
            created_dt = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
        except Exception:
            created_dt = now

        rule = self.match_rule(department_code=department, category=category, priority=priority)

        # Acknowledgement deadline
        ack_deadline_dt = created_dt + timedelta(hours=rule.acknowledgement_hours)
        acknowledged_at = grievance.get("acknowledged_at") or (
            created_dt.isoformat() if status in ["ASSIGNED", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "CLOSED"] else None
        )

        if acknowledged_at:
            ack_status = "MET"
        elif now > ack_deadline_dt:
            ack_status = "BREACHED"
        else:
            ack_status = "PENDING"

        # Resolution deadline
        stored_deadline = grievance.get("expected_resolution_at") or grievance.get("sla_deadline")
        if stored_deadline:
            try:
                res_deadline_dt = datetime.fromisoformat(stored_deadline.replace("Z", "+00:00"))
            except Exception:
                res_deadline_dt = created_dt + timedelta(hours=rule.resolution_hours)
        else:
            res_deadline_dt = created_dt + timedelta(hours=rule.resolution_hours)

        resolved_at = grievance.get("resolved_at")
        is_resolved = status in ["RESOLVED", "CLOSED"]
        if is_resolved:
            res_status = "MET"
        elif now > res_deadline_dt:
            res_status = "OVERDUE"
        else:
            res_status = "PENDING"

        # Elapsed & Remaining time
        elapsed_seconds = max(0, int((now - created_dt).total_seconds()))
        remaining_seconds = int((res_deadline_dt - now).total_seconds())
        is_overdue = (remaining_seconds < 0) and not is_resolved

        # Format human-readable time remaining / overdue
        if is_resolved:
            time_formatted = "Resolved"
        elif is_overdue:
            overdue_sec = abs(remaining_seconds)
            hrs = overdue_sec // 3600
            mins = (overdue_sec % 3600) // 60
            time_formatted = f"{hrs}h {mins:02d}m overdue"
        else:
            hrs = remaining_seconds // 3600
            mins = (remaining_seconds % 3600) // 60
            time_formatted = f"{hrs}h {mins:02d}m remaining"

        # Urgency & Escalation evaluation
        urgency = "NORMAL"
        reminder_recommended = False
        escalation_recommended = False
        escalation_reason = None

        if not is_resolved:
            # Check Acknowledgement breach
            if ack_status == "BREACHED" and current_tier == 0:
                urgency = "WARNING_SOON"
                escalation_recommended = True
                escalation_reason = (
                    f"Initial officer acknowledgement deadline ({rule.acknowledgement_hours}h) breached without assignment."
                )

            # Check Pre-deadline reminder window
            elif 0 < remaining_seconds <= (rule.reminder_before_hours * 3600):
                urgency = "WARNING_SOON"
                reminder_recommended = True

            # Check Overdue SLA
            elif is_overdue:
                overdue_hours = abs(remaining_seconds) / 3600.0
                if overdue_hours >= rule.escalation_after_hours or followup_count >= rule.max_reminders:
                    urgency = "CRITICAL_ESCALATION"
                    escalation_recommended = True
                    escalation_reason = (
                        f"Statutory resolution SLA expired (+{int(overdue_hours)}h overdue, {followup_count} notices sent)."
                    )
                else:
                    urgency = "BREACHED"
                    reminder_recommended = True

        return SlaEvaluationResult(
            grievance_id=gid,
            priority=priority,
            department=department,
            category=category,
            created_at=created_dt.isoformat(),
            acknowledgement_deadline=ack_deadline_dt.isoformat(),
            acknowledgement_status=ack_status,
            acknowledged_at=acknowledged_at,
            resolution_deadline=res_deadline_dt.isoformat(),
            resolution_status=res_status,
            resolved_at=resolved_at,
            elapsed_seconds=elapsed_seconds,
            time_remaining_seconds=remaining_seconds,
            time_remaining_formatted=time_formatted,
            is_overdue=is_overdue,
            urgency_level=urgency,
            reminder_recommended=reminder_recommended,
            escalation_recommended=escalation_recommended,
            escalation_reason=escalation_reason,
            current_escalation_tier=current_tier,
            followup_count=followup_count,
            applicable_rule_id=rule.rule_id
        )

# Global singleton
sla_engine = SlaEngine()
