import logging
import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime

from .models import (
    CitizenNotification,
    CreateCitizenNotificationRequest,
    NotificationEventType,
    NotificationChannel
)
from services.supabase_client import get_supabase
from services.audit import record_audit_event

logger = logging.getLogger("nagrikai.notification_service")

# 8 Core Lifecycle Initial Seed Data (for GRV-2026-1042 and system demo)
INITIAL_SEED_NOTIFICATIONS: List[CitizenNotification] = [
    CitizenNotification(
        id="notif-seed-08",
        grievance_id="GRV-2026-1042",
        citizen_id="citizen-001",
        title="SLA Escalation Triggered",
        message="Grievance escalated to Tier 2 (Superintending Engineer Er. Sunita Deshpande) for expedited executive oversight.",
        event_type=NotificationEventType.ESCALATION,
        type="alert",
        channel=NotificationChannel.ALL,
        read=False,
        created_at="2026-09-17T17:35:00.000Z",
        metadata={"tier": 2, "authority": "Er. Sunita Deshpande"}
    ),
    CitizenNotification(
        id="notif-seed-07",
        grievance_id="GRV-2026-1042",
        citizen_id="citizen-001",
        title="Field Inspection & Action Scheduled",
        message="Ward 12 rapid road repair squad dispatched. Cold-mix asphalt patching committed for 18 Sep 2026.",
        event_type=NotificationEventType.EXPECTED_ACTION,
        type="info",
        channel=NotificationChannel.WHATSAPP,
        read=False,
        created_at="2026-09-17T17:00:00.000Z",
        metadata={"scheduled_date": "2026-09-18T10:00:00Z"}
    ),
    CitizenNotification(
        id="notif-seed-06",
        grievance_id="GRV-2026-1042",
        citizen_id="citizen-001",
        title="Status Updated to In Progress",
        message="Municipal civil engineer acknowledged the complaint and accepted the AI recommended standard operating procedure.",
        event_type=NotificationEventType.STATUS_CHANGE,
        type="info",
        channel=NotificationChannel.IN_APP,
        read=False,
        created_at="2026-09-17T15:45:00.000Z",
        metadata={"new_status": "IN_PROGRESS"}
    ),
    CitizenNotification(
        id="notif-seed-05",
        grievance_id="GRV-2026-1042",
        citizen_id="citizen-001",
        title="Evidence Request: Additional Landmarks",
        message="AI verification engine requested clear intersection photos to pinpoint storm drain blockage near Sinhagad Road.",
        event_type=NotificationEventType.EVIDENCE_REQUEST,
        type="warning",
        channel=NotificationChannel.SMS,
        read=True,
        created_at="2026-09-17T14:15:00.000Z",
        metadata={"requested_item": "Intersection landmark photo"}
    ),
    CitizenNotification(
        id="notif-seed-04",
        grievance_id="GRV-2026-1042",
        citizen_id="citizen-001",
        title="Statutory RTSA Official Acknowledgement",
        message="Formal receipt acknowledged under Maharashtra RTSA 2015. 72-hour statutory SLA clock commenced.",
        event_type=NotificationEventType.ACKNOWLEDGEMENT,
        type="success",
        channel=NotificationChannel.SMS,
        read=True,
        created_at="2026-09-17T12:05:00.000Z",
        metadata={"sla_hours": 72}
    ),
    CitizenNotification(
        id="notif-seed-03",
        grievance_id="GRV-2026-1042",
        citizen_id="citizen-001",
        title="Authority Mapped: PMC Ward 12",
        message="Assigned to Er. Rajesh Sharma (Executive Engineer, PMC Road Maintenance Division).",
        event_type=NotificationEventType.ASSIGNMENT,
        type="info",
        channel=NotificationChannel.ALL,
        read=True,
        created_at="2026-09-17T11:55:00.000Z",
        metadata={"officer": "Er. Rajesh Sharma", "ward": "Ward 12"}
    ),
    CitizenNotification(
        id="notif-seed-02",
        grievance_id="GRV-2026-1042",
        citizen_id="citizen-001",
        title="Grievance Lodged Successfully",
        message="Case GRV-2026-1042 recorded with 2 geotagged photos and DigiLocker Aadhaar verification.",
        event_type=NotificationEventType.SUBMISSION,
        type="success",
        channel=NotificationChannel.ALL,
        read=True,
        created_at="2026-09-17T10:32:00.000Z",
        metadata={"tracking_id": "GRV-2026-1042"}
    ),
    CitizenNotification(
        id="notif-seed-01",
        grievance_id="GRV-2026-1038",
        citizen_id="citizen-001",
        title="Case Resolved: Streetlight Restored",
        message="Work order completed. Luminaires replaced and verified by Ward electrical supervisor. Please rate your service.",
        event_type=NotificationEventType.RESOLUTION,
        type="success",
        channel=NotificationChannel.SMS,
        read=True,
        created_at="2026-09-16T18:20:00.000Z",
        metadata={"rating_eligible": True}
    ),
]

class CitizenNotificationService:
    """
    Automated Multi-Channel Citizen Notification Service.
    Handles notifications across the 8 civic grievance lifecycle events.
    """

    def __init__(self):
        self._notifications: List[CitizenNotification] = list(INITIAL_SEED_NOTIFICATIONS)

    def get_notifications(
        self,
        citizen_id: Optional[str] = None,
        grievance_id: Optional[str] = None,
        unread_only: bool = False
    ) -> List[CitizenNotification]:
        """Fetches notifications filtered by citizen or grievance."""
        items = self._notifications
        if citizen_id:
            items = [n for n in items if n.citizen_id == citizen_id]
        if grievance_id:
            items = [n for n in items if n.grievance_id == grievance_id]
        if unread_only:
            items = [n for n in items if not n.read]
        
        # Sort newest first
        return sorted(items, key=lambda x: x.created_at, reverse=True)

    def get_unread_count(self, citizen_id: Optional[str] = None) -> int:
        """Returns the number of unread notifications."""
        items = self.get_notifications(citizen_id=citizen_id, unread_only=True)
        return len(items)

    def create_notification(
        self,
        req: CreateCitizenNotificationRequest
    ) -> CitizenNotification:
        """
        Creates, audits, and broadcasts a citizen notification for a lifecycle event.
        """
        now_iso = datetime.utcnow().isoformat()
        notif_id = f"notif-{uuid.uuid4().hex[:8]}"

        # Smart defaults based on the 8 lifecycle events
        title = req.title or self._default_title(req.event_type, req.grievance_id)
        message = req.message or self._default_message(req.event_type, req.grievance_id, req.metadata)
        notif_type = req.type or self._default_type(req.event_type)

        notif = CitizenNotification(
            id=notif_id,
            grievance_id=req.grievance_id,
            citizen_id=req.citizen_id or "citizen-001",
            title=title,
            message=message,
            event_type=req.event_type,
            type=notif_type,
            channel=req.channel or NotificationChannel.ALL,
            read=False,
            created_at=now_iso,
            metadata=req.metadata or {}
        )

        self._notifications.insert(0, notif)
        logger.info(f"[CITIZEN NOTIF CREATED] [{req.event_type.value}] {req.grievance_id}: {title}")

        # Supabase persistence
        client = get_supabase()
        if client:
            try:
                client.table("citizen_notifications").insert({
                    "id": notif.id,
                    "grievance_id": notif.grievance_id,
                    "citizen_id": notif.citizen_id,
                    "title": notif.title,
                    "message": notif.message,
                    "event_type": notif.event_type.value,
                    "type": notif.type,
                    "channel": notif.channel.value,
                    "read": notif.read,
                    "created_at": notif.created_at,
                    "metadata": notif.metadata
                }).execute()
            except Exception as e:
                logger.warning(f"Could not persist notification in Supabase: {e}")

        # Section 65B Audit Record
        record_audit_event(
            supabase_client=client,
            action=f"CITIZEN_NOTIF_{req.event_type.value}",
            details=f"Dispatched citizen notification: '{title}' via {notif.channel.value}.",
            grievance_id=req.grievance_id,
            actor_type="SYSTEM",
            actor_name="NagrikAI Notification Dispatcher",
            metadata={
                "notification_id": notif.id,
                "event_type": req.event_type.value,
                "channel": notif.channel.value,
                "message": message
            }
        )

        return notif

    def mark_read(self, notification_id: str) -> bool:
        """Marks a single notification as read."""
        for n in self._notifications:
            if n.id == notification_id:
                n.read = True
                client = get_supabase()
                if client:
                    try:
                        client.table("citizen_notifications").update({"read": True}).eq("id", notification_id).execute()
                    except Exception as e:
                        logger.warning(f"Supabase update failed: {e}")
                return True
        return False

    def mark_all_read(self, citizen_id: Optional[str] = None) -> int:
        """Marks all notifications as read."""
        count = 0
        for n in self._notifications:
            if not citizen_id or n.citizen_id == citizen_id:
                if not n.read:
                    n.read = True
                    count += 1
        
        client = get_supabase()
        if client:
            try:
                query = client.table("citizen_notifications").update({"read": True})
                if citizen_id:
                    query = query.eq("citizen_id", citizen_id)
                query.execute()
            except Exception as e:
                logger.warning(f"Supabase batch mark-read failed: {e}")

        return count

    def _default_title(self, event_type: NotificationEventType, gid: str) -> str:
        mapping = {
            NotificationEventType.SUBMISSION: f"Grievance Lodged #{gid}",
            NotificationEventType.ASSIGNMENT: "Municipal Officer Assigned",
            NotificationEventType.ACKNOWLEDGEMENT: "Statutory RTSA Acknowledged",
            NotificationEventType.STATUS_CHANGE: "Case Status Updated",
            NotificationEventType.EVIDENCE_REQUEST: "Additional Evidence Requested",
            NotificationEventType.EXPECTED_ACTION: "Action Scheduled",
            NotificationEventType.RESOLUTION: "Grievance Resolved Successfully",
            NotificationEventType.ESCALATION: "SLA Breach — Case Escalated",
        }
        return mapping.get(event_type, f"Update on {gid}")

    def _default_message(self, event_type: NotificationEventType, gid: str, metadata: Optional[Dict[str, Any]]) -> str:
        meta = metadata or {}
        if event_type == NotificationEventType.SUBMISSION:
            return f"Your grievance {gid} was registered and queued for automated AI analysis."
        elif event_type == NotificationEventType.ASSIGNMENT:
            officer = meta.get("officer", "Ward Junior Engineer")
            dept = meta.get("department", "Civil Works")
            return f"Assigned to {officer} ({dept})."
        elif event_type == NotificationEventType.ACKNOWLEDGEMENT:
            return f"Municipal authority has formally acknowledged case {gid} under RTSA 2015 standards."
        elif event_type == NotificationEventType.STATUS_CHANGE:
            status = meta.get("status", "IN_PROGRESS").replace("_", " ")
            return f"Case status updated to {status}."
        elif event_type == NotificationEventType.EVIDENCE_REQUEST:
            reason = meta.get("reason", "Please provide additional photos or landmark information.")
            return f"Officer requested more evidence: {reason}"
        elif event_type == NotificationEventType.EXPECTED_ACTION:
            date_str = meta.get("date", "upcoming field inspection")
            return f"Field maintenance action scheduled for {date_str}."
        elif event_type == NotificationEventType.RESOLUTION:
            return f"Municipal crew has completed resolution work for {gid}. Please review the resolution proof."
        elif event_type == NotificationEventType.ESCALATION:
            tier = meta.get("tier", 2)
            officer = meta.get("authority", "Superintending Engineer")
            return f"SLA breached: Case escalated to Tier {tier} ({officer}) for expedited intervention."
        return f"Operational update logged for grievance {gid}."

    def _default_type(self, event_type: NotificationEventType) -> str:
        if event_type in [NotificationEventType.RESOLUTION, NotificationEventType.ACKNOWLEDGEMENT]:
            return "success"
        elif event_type in [NotificationEventType.ESCALATION]:
            return "alert"
        elif event_type in [NotificationEventType.EVIDENCE_REQUEST]:
            return "warning"
        return "info"

# Global singleton
citizen_notification_service = CitizenNotificationService()
