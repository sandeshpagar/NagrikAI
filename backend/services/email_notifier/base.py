from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime

class EmailRecipient(BaseModel):
    """
    Recipient information for municipal authority email dispatch.
    """
    name: str = Field(..., description="Full name of recipient officer")
    email: str = Field(..., description="Statutory government email address")
    designation: Optional[str] = Field(None, description="Official rank/designation")
    department: Optional[str] = Field(None, description="Department name or code")

class EmailMessage(BaseModel):
    """
    Complete payload for an outgoing authority email notification.
    """
    recipient: EmailRecipient
    subject: str = Field(..., description="Subject line of official notice")
    html_content: str = Field(..., description="Rendered responsive HTML content")
    text_content: Optional[str] = Field(None, description="Plaintext fallback content")
    grievance_id: Optional[str] = Field(None, description="Supabase UUID or reference")
    grievance_number: Optional[str] = Field(None, description="Civic tracking ID e.g. GRV-2026-1042")
    idempotency_key: Optional[str] = Field(None, description="Deduplication key to suppress duplicate sends")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Diagnostic and routing metadata")

class EmailDispatchResult(BaseModel):
    """
    Outcome returned after attempting email transmission.
    """
    success: bool
    message_id: str
    provider: str = Field(..., description="MOCK | SMTP | RESEND")
    recipient_email: str
    sent_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    is_duplicate: bool = Field(False, description="True if send was suppressed due to idempotency key")
    error: Optional[str] = None
    preview_url: Optional[str] = None

class BaseEmailAdapter(ABC):
    """
    Abstract interface for email transmission adapters.
    """
    @abstractmethod
    def send(self, message: EmailMessage) -> EmailDispatchResult:
        """
        Transmits email message and returns outcome.
        """
        pass
