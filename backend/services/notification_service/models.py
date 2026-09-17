from enum import Enum
from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field

class NotificationEventType(str, Enum):
    SUBMISSION = "SUBMISSION"
    ASSIGNMENT = "ASSIGNMENT"
    ACKNOWLEDGEMENT = "ACKNOWLEDGEMENT"
    STATUS_CHANGE = "STATUS_CHANGE"
    EVIDENCE_REQUEST = "EVIDENCE_REQUEST"
    EXPECTED_ACTION = "EXPECTED_ACTION"
    RESOLUTION = "RESOLUTION"
    ESCALATION = "ESCALATION"

class NotificationChannel(str, Enum):
    IN_APP = "IN_APP"
    SMS = "SMS"
    WHATSAPP = "WHATSAPP"
    EMAIL = "EMAIL"
    ALL = "ALL"

class CitizenNotification(BaseModel):
    id: str
    grievance_id: str
    citizen_id: Optional[str] = "citizen-001"
    title: str
    message: str
    event_type: NotificationEventType
    type: str = Field(default="info", description="UI indicator: info, success, warning, alert")
    channel: NotificationChannel = NotificationChannel.ALL
    read: bool = False
    created_at: str
    metadata: Optional[Dict[str, Any]] = None

class CreateCitizenNotificationRequest(BaseModel):
    grievance_id: str
    event_type: NotificationEventType
    citizen_id: Optional[str] = "citizen-001"
    title: Optional[str] = None
    message: Optional[str] = None
    type: Optional[str] = None
    channel: Optional[NotificationChannel] = NotificationChannel.ALL
    metadata: Optional[Dict[str, Any]] = None

class CitizenNotificationListResponse(BaseModel):
    success: bool = True
    unread_count: int
    total_count: int
    notifications: List[CitizenNotification]
