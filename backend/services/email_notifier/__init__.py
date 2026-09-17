from .base import EmailRecipient, EmailMessage, EmailDispatchResult, BaseEmailAdapter
from .mock_adapter import MockEmailAdapter
from .smtp_adapter import SMTPEmailAdapter
from .notifier_service import EmailNotifierService, email_notifier_service

__all__ = [
    "EmailRecipient",
    "EmailMessage",
    "EmailDispatchResult",
    "BaseEmailAdapter",
    "MockEmailAdapter",
    "SMTPEmailAdapter",
    "EmailNotifierService",
    "email_notifier_service",
]
