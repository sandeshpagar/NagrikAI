import logging
import uuid
from typing import List, Dict, Any
from datetime import datetime

from .base import BaseEmailAdapter, EmailMessage, EmailDispatchResult

logger = logging.getLogger("nagrikai.email.mock")

class MockEmailAdapter(BaseEmailAdapter):
    """
    High-fidelity mock email adapter for local development.
    Captures messages in-memory, logs formatted previews, and requires zero external credentials.
    """

    def __init__(self):
        self.sent_messages: List[Dict[str, Any]] = []

    def send(self, message: EmailMessage) -> EmailDispatchResult:
        msg_id = f"MOCK-MSG-{uuid.uuid4().hex[:12].upper()}"
        timestamp = datetime.utcnow().isoformat() + "Z"

        record = {
            "message_id": msg_id,
            "recipient": message.recipient.dict(),
            "subject": message.subject,
            "sent_at": timestamp,
            "grievance_number": message.grievance_number,
            "grievance_id": message.grievance_id,
            "html_length": len(message.html_content),
            "idempotency_key": message.idempotency_key,
            "metadata": message.metadata,
        }

        self.sent_messages.append(record)

        logger.info(
            f"[MOCK EMAIL DISPATCH] To: {message.recipient.name} <{message.recipient.email}> | "
            f"Subject: '{message.subject}' | MsgID: {msg_id} | Grievance: {message.grievance_number}"
        )

        return EmailDispatchResult(
            success=True,
            message_id=msg_id,
            provider="MOCK",
            recipient_email=message.recipient.email,
            sent_at=timestamp,
            is_duplicate=False,
            preview_url=f"/api/notifications/email/preview/{msg_id}"
        )

    def get_history(self, limit: int = 20) -> List[Dict[str, Any]]:
        return self.sent_messages[-limit:]
