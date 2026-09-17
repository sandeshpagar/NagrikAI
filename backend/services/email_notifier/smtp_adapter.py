import logging
import smtplib
import uuid
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from datetime import datetime

from .base import BaseEmailAdapter, EmailMessage, EmailDispatchResult

logger = logging.getLogger("nagrikai.email.smtp")

class SMTPEmailAdapter(BaseEmailAdapter):
    """
    Standard SMTP adapter supporting STARTTLS / SSL.
    Falls back gracefully if connection cannot be established.
    """

    def __init__(
        self,
        host: Optional[str] = None,
        port: int = 587,
        username: Optional[str] = None,
        password: Optional[str] = None,
        from_email: str = "alerts@pmc.nagrikai.gov.in",
        use_tls: bool = True
    ):
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self.from_email = from_email
        self.use_tls = use_tls

    def send(self, message: EmailMessage) -> EmailDispatchResult:
        if not self.host:
            logger.warning("[SMTP ADAPTER] No SMTP_HOST configured. Simulating dispatch.")
            return EmailDispatchResult(
                success=True,
                message_id=f"SMTP-SIM-{uuid.uuid4().hex[:12].upper()}",
                provider="SMTP_SIMULATED",
                recipient_email=message.recipient.email,
                sent_at=datetime.utcnow().isoformat() + "Z",
                is_duplicate=False
            )

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = message.subject
            msg["From"] = f"NagrikAI Civic Portal <{self.from_email}>"
            msg["To"] = f"{message.recipient.name} <{message.recipient.email}>"

            if message.text_content:
                msg.attach(MIMEText(message.text_content, "plain"))
            msg.attach(MIMEText(message.html_content, "html"))

            with smtplib.SMTP(self.host, self.port, timeout=10) as server:
                if self.use_tls:
                    server.starttls()
                if self.username and self.password:
                    server.login(self.username, self.password)
                server.sendmail(self.from_email, [message.recipient.email], msg.as_string())

            msg_id = f"SMTP-{uuid.uuid4().hex[:12].upper()}"
            logger.info(f"[SMTP DISPATCH SUCCESS] Sent to {message.recipient.email} via {self.host}")

            return EmailDispatchResult(
                success=True,
                message_id=msg_id,
                provider="SMTP",
                recipient_email=message.recipient.email,
                sent_at=datetime.utcnow().isoformat() + "Z",
                is_duplicate=False
            )
        except Exception as e:
            logger.error(f"[SMTP DISPATCH ERROR] Failed sending to {message.recipient.email}: {e}")
            return EmailDispatchResult(
                success=False,
                message_id=f"SMTP-FAIL-{uuid.uuid4().hex[:8].upper()}",
                provider="SMTP",
                recipient_email=message.recipient.email,
                sent_at=datetime.utcnow().isoformat() + "Z",
                is_duplicate=False,
                error=str(e)
            )
