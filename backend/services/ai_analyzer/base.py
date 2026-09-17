from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class CivicEntity(BaseModel):
    name: str
    type: str = Field(..., description="Type of entity: LOCATION, LANDMARK, WARD, HAZARD, BODY, PERSON")


class GrievanceAnalysisInput(BaseModel):
    complaint_text: str = Field(..., min_length=5, description="Full complaint text or title + description")
    language: Optional[str] = Field("English", description="Language of complaint: English, Hindi, Marathi")
    location: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Location metadata: ward, address, lat, lng")
    evidence_analysis: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Evidence verification outputs: risk_score, status, tampering")


class GrievanceAnalysisOutput(BaseModel):
    category: str = Field(..., description="High-level municipal category")
    subcategory: str = Field(..., description="Granular issue subcategory")
    issue: str = Field(..., description="Concise statement of core municipal issue")
    summary: str = Field(..., description="Clear administrative summary in English")
    department: str = Field(..., description="Responsible municipal department name")
    jurisdiction: str = Field(..., description="Jurisdiction / ward authority")
    priority: str = Field(..., pattern="^(CRITICAL|HIGH|MEDIUM|LOW)$", description="Priority level")
    duration: str = Field("Reported today", description="Reported duration of problem")
    affected_population: int = Field(100, ge=1, description="Estimated population impacted")
    entities: List[CivicEntity] = Field(default_factory=list, description="Extracted civic entities")
    recommended_action: str = Field(..., description="Concrete actionable SOP directive for field officer")
    recommendation_rationale: Optional[str] = Field(None, description="Legal/technical rationale for recommendation")
    confidence: float = Field(..., ge=0.0, le=100.0, description="Model confidence percentage (0-100)")
    severity_score: float = Field(5.0, ge=1.0, le=10.0, description="Severity rating from 1 to 10")
    model_name: str = Field(..., description="Identifier of model or engine producing this result")
    is_fallback: bool = Field(False, description="Whether this analysis came from a fallback engine")


class BaseGrievanceAnalyzer(ABC):
    """
    Abstract interface for AI Grievance Analyzers.
    Guarantees pluggable swap between Local Ollama, Cloud Gemini, and Heuristic Fallback.
    """

    @abstractmethod
    def analyze(self, input_data: GrievanceAnalysisInput) -> GrievanceAnalysisOutput:
        """
        Analyzes grievance input data and returns strictly validated GrievanceAnalysisOutput.
        Must not mutate any database directly.
        """
        pass
