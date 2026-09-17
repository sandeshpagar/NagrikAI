from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Dict, Any
from datetime import datetime

class EvidenceBase(BaseModel):
    storage_path: str = Field(..., description="Bucket storage path or relative URL")
    file_name: str = Field(..., description="Original filename")
    mime_type: str = Field(..., description="MIME type of evidence (e.g. image/jpeg)")
    file_size: int = Field(..., description="File size in bytes")
    sha256: str = Field(..., description="Cryptographic SHA-256 integrity hash")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="EXIF or device metadata")

class EvidenceCreate(EvidenceBase):
    pass

class EvidenceResponse(EvidenceBase):
    id: str
    grievance_id: str
    verification_status: str
    risk_score: Optional[float] = 0.0
    created_at: datetime

    class Config:
        from_attributes = True

class GrievanceBase(BaseModel):
    title: str = Field(..., min_length=5, max_length=200, description="Summary title of the civic complaint")
    description: str = Field(..., min_length=10, description="Detailed problem description")
    category: Optional[str] = Field("Public Works", description="Civic category")
    subcategory: Optional[str] = None
    ward: Optional[str] = Field("Ward 12", description="Municipal administrative ward")
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    language: Optional[str] = "English"
    priority: Optional[str] = Field("MEDIUM", description="CRITICAL, HIGH, MEDIUM, or LOW")

class GrievanceCreate(GrievanceBase):
    citizen_name: Optional[str] = "Ramesh Kulkarni"
    citizen_phone: Optional[str] = "+91 98220 54199"
    citizen_id: Optional[str] = None
    evidence_items: Optional[List[EvidenceCreate]] = []

class GrievanceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    authority_directive: Optional[Dict[str, Any]] = None
    department_id: Optional[str] = None
    authority_id: Optional[str] = None

class GrievanceResponse(GrievanceBase):
    id: str
    grievance_number: str
    citizen_id: Optional[str] = None
    department_id: Optional[str] = None
    authority_id: Optional[str] = None
    jurisdiction_id: Optional[str] = None
    status: str
    ledger_hash: Optional[str] = None
    expected_resolution_at: Optional[datetime] = None
    evidence: Optional[List[EvidenceResponse]] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class GrievanceListResponse(BaseModel):
    total: int
    items: List[GrievanceResponse]

class AuditLogResponse(BaseModel):
    id: str
    grievance_number: Optional[str] = None
    actor_type: str
    actor_name: str
    action: str
    details: str
    created_at: datetime

    class Config:
        from_attributes = True
