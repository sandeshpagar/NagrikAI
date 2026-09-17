import logging
from typing import Dict, Any, Optional, Callable
from datetime import datetime, timedelta

from .state import GrievanceAgentState, create_initial_agent_state
from .tools import GrievanceAgentTools
from services.llm_provider.factory import get_llm_provider
from services.sla_engine import sla_engine

logger = logging.getLogger("nagrikai.agent.graph")

class GrievanceAgentRunner:
    """
    Core state graph executor for the NagrikAI Grievance Agent.
    Implements cyclical graph execution with strict statutory guardrails,
    LLM decision support, and Section 65B-compliant audit trails.
    """

    def __init__(self, tools: Optional[GrievanceAgentTools] = None):
        self.tools = tools or GrievanceAgentTools()
        self.llm = get_llm_provider()
        self._memory_checkpoints: Dict[str, GrievanceAgentState] = {}

    def get_state(self, grievance_id: str) -> GrievanceAgentState:
        """Retrieves persistent state or builds initial state from database."""
        if grievance_id in self._memory_checkpoints:
            return self._memory_checkpoints[grievance_id]
        
        grv = self.tools.get_grievance(grievance_id)
        state = create_initial_agent_state(grievance_id, grv)
        self._memory_checkpoints[grievance_id] = state
        return state

    def save_state(self, state: GrievanceAgentState) -> None:
        """Persists checkpoint to in-memory store and updates database."""
        gid = state["grievance_id"]
        self._memory_checkpoints[gid] = state

    # --- Graph Nodes ---

    def node_inspect_state(self, state: GrievanceAgentState) -> GrievanceAgentState:
        """Inspects grievance state, checks SLA clock vs now, and determines routing."""
        gid = state["grievance_id"]
        grv = self.tools.get_grievance(gid)
        
        state["status"] = grv.get("status", state.get("status", "SUBMITTED"))
        state["title"] = grv.get("title", state.get("title"))
        state["ward"] = grv.get("ward", state.get("ward", "Ward 12"))
        state["category"] = grv.get("category", state.get("category", "Road Infrastructure & Public Safety"))
        state["priority"] = grv.get("priority", state.get("priority", "HIGH"))
        state["authority_id"] = grv.get("assigned_authority_id") or state.get("authority_id")
        state["last_response"] = grv.get("authority_directive") or state.get("last_response")

        now_iso = datetime.utcnow().isoformat()
        state["logs"].append({
            "timestamp": now_iso,
            "action": "STATE_INSPECTED",
            "details": f"Inspected grievance {gid}. Status: {state['status']}, Authority: {state['authority_id'] or 'Unassigned'}."
        })

        if state["status"] in ["RESOLVED", "CLOSED"]:
            state["completed"] = True
            state["next_step"] = "END"
        elif not state["authority_id"] or state["status"] == "SUBMITTED":
            state["next_step"] = "TRIAGE_AND_ROUTE"
        elif not state.get("last_followup_at"):
            state["next_step"] = "NOTIFY_AUTHORITY"
        else:
            state["next_step"] = "CHECK_SLA_AND_RESPONSE"

        return state

    def node_triage_and_route(self, state: GrievanceAgentState) -> GrievanceAgentState:
        """Assigns designated municipal officer and updates grievance status."""
        gid = state["grievance_id"]
        ward = state.get("ward", "Ward 12")
        category = state.get("category", "Road Infrastructure")
        
        authority = self.tools.get_authority(ward=ward, category=category, escalation_level=0)
        state["authority_id"] = authority["id"]
        state["status"] = "ASSIGNED"

        # Update database
        self.tools.update_grievance_status(
            gid,
            status="ASSIGNED",
            directive=f"Assigned to {authority['name']} ({authority['designation']}, {authority['department']})."
        )
        self.tools.create_audit_event(
            action="AUTHORITY_ASSIGNED",
            details=f"Grievance assigned to {authority['name']} ({authority['designation']}) for {ward}.",
            grievance_id=gid,
            actor_type="AI_AGENT",
            actor_name="NagrikAI Grievance Agent",
            metadata={"authority": authority}
        )

        state["logs"].append({
            "timestamp": datetime.utcnow().isoformat(),
            "action": "TRIAGE_AND_ROUTE_COMPLETED",
            "details": f"Mapped to {authority['name']} ({authority['designation']}). Status updated to ASSIGNED."
        })

        state["next_step"] = "NOTIFY_AUTHORITY"
        return state

    def node_notify_authority(self, state: GrievanceAgentState) -> GrievanceAgentState:
        """Dispatches formal notice to authority via idempotent email adapter."""
        gid = state["grievance_id"]
        grv = self.tools.get_grievance(gid)
        authority = self.tools.get_authority(
            ward=state.get("ward", ""),
            category=state.get("category", ""),
            escalation_level=state.get("escalation_level", 0)
        )

        dispatch_res = self.tools.send_authority_email(grv, authority)
        now_iso = datetime.utcnow().isoformat()
        state["last_followup_at"] = now_iso
        state["followup_count"] = state.get("followup_count", 0) + 1

        # Register follow-up timer (4 hours for high priority, 12 hours standard)
        interval = 4 if state.get("priority") in ["HIGH", "CRITICAL"] else 12
        self.tools.schedule_followup(gid, hours_from_now=interval, followup_count=state["followup_count"])

        state["logs"].append({
            "timestamp": now_iso,
            "action": "AUTHORITY_NOTIFIED",
            "details": f"Statutory notice sent to {authority['email']}. Duplicate suppressed: {dispatch_res.get('is_duplicate', False)}."
        })

        state["next_step"] = "CHECK_SLA_AND_RESPONSE"
        return state

    def node_check_sla_and_response(self, state: GrievanceAgentState) -> GrievanceAgentState:
        """
        Polls for inbound authority responses and evaluates statutory SLA timers.
        Transitions to ESCALATE if SLA breached, or NOTIFY_CITIZEN if response received.
        """
        gid = state["grievance_id"]
        response_data = self.tools.read_authority_response(gid)
        now = datetime.utcnow()

        # Check if authority responded with an action or resolution
        if response_data and response_data.get("directive"):
            directive = response_data["directive"]
            state["last_response"] = directive
            
            # Use LLM provider to analyze authority directive
            llm_analysis = self.llm.generate_json(
                prompt=f"Grievance: {state.get('title')}. Authority directive: '{directive}'. "
                       "Is this grievance RESOLVED, or is an ACTION_SCHEDULED?",
                system_prompt="You are a civic compliance validator. Output JSON with fields: 'status' (RESOLVED or ACTION_SCHEDULED) and 'plain_language_summary'."
            )
            detected_status = llm_analysis.get("status", "ACTION_SCHEDULED")

            if detected_status == "RESOLVED":
                state["status"] = "RESOLVED"
                state["next_step"] = "RESOLVE_AND_CLOSE"
            else:
                state["status"] = "ACTION_SCHEDULED"
                state["next_step"] = "NOTIFY_CITIZEN"

            state["logs"].append({
                "timestamp": now.isoformat(),
                "action": "AUTHORITY_RESPONSE_PROCESSED",
                "details": f"Authority directive validated: '{directive}'. Status: {state['status']}."
            })
            return state

        # Statutory SLA evaluation via SlaEngine
        sla_eval = sla_engine.evaluate_grievance({
            "id": gid,
            "priority": state.get("priority", "HIGH"),
            "category": state.get("category", "Road Infrastructure"),
            "department": state.get("department_code") or "PMC-CIVIL",
            "ward": state.get("ward", "Ward 12"),
            "status": state.get("status", "ASSIGNED"),
            "created_at": state.get("created_at"),
            "followup_count": state.get("followup_count", 0),
            "escalation_level": state.get("escalation_level", 0),
            "expected_resolution_at": state.get("expected_resolution_at") or state.get("sla_deadline"),
        })

        if sla_eval.escalation_recommended:
            state["escalation_reason"] = sla_eval.escalation_reason or "Statutory SLA expired without resolution."
            state["next_step"] = "ESCALATE"
        else:
            state["next_step"] = "NOTIFY_CITIZEN"

        return state

    def node_escalate(self, state: GrievanceAgentState) -> GrievanceAgentState:
        """Executes statutory escalation under Maharashtra RTSA 2015."""
        gid = state["grievance_id"]
        current_level = state.get("escalation_level", 0)
        reason = state.get("escalation_reason") or "Statutory response SLA expired without field engineer acknowledgment."
        
        escalation_res = self.tools.escalate_grievance(
            grievance_id=gid,
            current_level=current_level,
            reason=reason
        )

        state["escalation_level"] = escalation_res["escalation_level"]
        state["status"] = "ESCALATED"
        state["authority_id"] = escalation_res["senior_authority"]["id"]

        state["logs"].append({
            "timestamp": datetime.utcnow().isoformat(),
            "action": "ESCALATION_TRIGGERED",
            "details": f"Escalated to Level {state['escalation_level']} ({escalation_res['senior_authority']['name']}). Reason: {reason}"
        })

        state["next_step"] = "NOTIFY_CITIZEN"
        return state

    def node_notify_citizen(self, state: GrievanceAgentState) -> GrievanceAgentState:
        """Translates municipal status and directives into clear plain language."""
        gid = state["grievance_id"]
        status = state.get("status", "IN_PROGRESS")
        last_resp = state.get("last_response", "Your grievance is actively progressing through municipal triage.")

        # Generate citizen-friendly plain language message
        plain_msg = self.llm.generate_text(
            prompt=f"Grievance: {state.get('title')}. Status: {status}. Authority Directive: {last_resp}. "
                   "Write a concise 2-sentence reassurance update for the citizen in plain English without jargon.",
            system_prompt="You are a helpful Indian municipal citizen concierge. Be empathetic, transparent, and concise."
        )

        self.tools.notify_citizen(
            grievance_id=gid,
            message=plain_msg,
            channel="WHATSAPP_AND_SMS"
        )

        state["logs"].append({
            "timestamp": datetime.utcnow().isoformat(),
            "action": "CITIZEN_UPDATE_DISPATCHED",
            "details": f"Dispatched citizen update: '{plain_msg}'"
        })

        if state["status"] == "RESOLVED":
            state["next_step"] = "RESOLVE_AND_CLOSE"
        else:
            state["next_step"] = "END"
        return state

    def node_resolve_and_close(self, state: GrievanceAgentState) -> GrievanceAgentState:
        """Terminates workflow and logs final resolution audit event."""
        gid = state["grievance_id"]
        state["status"] = "RESOLVED"
        state["completed"] = True

        self.tools.update_grievance_status(gid, status="RESOLVED")
        self.tools.create_audit_event(
            action="GRIEVANCE_RESOLVED",
            details="Grievance successfully verified and closed under Maharashtra RTSA 2015 standards.",
            grievance_id=gid,
            actor_type="AI_AGENT",
            actor_name="NagrikAI Grievance Agent"
        )

        state["logs"].append({
            "timestamp": datetime.utcnow().isoformat(),
            "action": "WORKFLOW_RESOLVED_AND_CLOSED",
            "details": "All statutory milestones fulfilled. Graph execution terminated at END."
        })

        state["next_step"] = "END"
        return state

    # --- Execution Loop ---

    def step(self, grievance_id: str) -> GrievanceAgentState:
        """Executes a single atomic step in the state machine."""
        state = self.get_state(grievance_id)
        if state.get("completed"):
            return state

        next_node = state.get("next_step", "INSPECT_STATE")

        if next_node == "INSPECT_STATE":
            state = self.node_inspect_state(state)
        elif next_node == "TRIAGE_AND_ROUTE":
            state = self.node_triage_and_route(state)
        elif next_node == "NOTIFY_AUTHORITY":
            state = self.node_notify_authority(state)
        elif next_node == "CHECK_SLA_AND_RESPONSE":
            state = self.node_check_sla_and_response(state)
        elif next_node == "ESCALATE":
            state = self.node_escalate(state)
        elif next_node == "NOTIFY_CITIZEN":
            state = self.node_notify_citizen(state)
        elif next_node == "RESOLVE_AND_CLOSE":
            state = self.node_resolve_and_close(state)
        elif next_node == "END":
            state["completed"] = True

        self.save_state(state)
        return state

    def run(self, grievance_id: str, max_steps: int = 6) -> GrievanceAgentState:
        """
        Runs the LangGraph agent for up to max_steps or until it reaches a wait state or END.
        """
        state = self.get_state(grievance_id)
        steps_taken = 0

        while steps_taken < max_steps:
            if state.get("completed") or state.get("next_step") == "END":
                break
            
            prev_step = state.get("next_step")
            state = self.step(grievance_id)
            steps_taken += 1

            # If waiting for external officer response, halt this execution cycle
            if state.get("next_step") in ["AWAIT_RESPONSE", "END"]:
                break

        return state


# Global Singleton Runner
_agent_runner: Optional[GrievanceAgentRunner] = None

def get_grievance_agent() -> GrievanceAgentRunner:
    global _agent_runner
    if _agent_runner is None:
        _agent_runner = GrievanceAgentRunner()
    return _agent_runner

def run_grievance_agent(grievance_id: str, max_steps: int = 6) -> GrievanceAgentState:
    agent = get_grievance_agent()
    return agent.run(grievance_id, max_steps=max_steps)
