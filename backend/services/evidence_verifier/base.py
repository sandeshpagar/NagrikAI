from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class TamperAnalysisResult(BaseModel):
    """
    Forensic analysis output from a tamper / generative AI detector.
    Authenticity is probabilistic and capped at 0.984 (never 1.0).
    """
    risk_score: float = Field(..., ge=0.0, le=1.0, description="Tamper/synthetic risk score (0.0 to 1.0)")
    is_ai_generated: bool = Field(default=False, description="Whether generative AI artifacts were detected")
    detected_software: Optional[str] = Field(default=None, description="Software signature (e.g. Photoshop, Midjourney)")
    confidence: float = Field(..., ge=0.0, le=98.4, description="Detector confidence capped at 98.4%")
    details: str = Field(default="", description="Forensic inspection findings")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional inspection metrics")

class BaseTamperDetector(ABC):
    """
    Pluggable abstract interface for evidence manipulation & synthetic image detection.
    Allows swappable implementations (Heuristics, Local Ollama Llama-Vision, Cloud models, Mocks).
    """
    @abstractmethod
    def analyze(self, image_bytes: bytes, metadata: Dict[str, Any]) -> TamperAnalysisResult:
        """
        Performs forensic analysis on image binary stream and EXIF metadata.
        """
        pass
