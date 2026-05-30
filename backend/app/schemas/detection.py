"""detection.py — Pydantic schemas for detection, analysis, and reporting."""

from typing import Any, Optional

from pydantic import BaseModel, Field


class AnalysisRequest(BaseModel):
    """Payload for the preview analysis endpoint (no DB save)."""

    type: str
    url: Optional[str] = ""
    summary: Optional[str] = ""
    sender_numbers: Optional[str] = ""
    screenshot_path: Optional[str] = ""
    attachment_path: Optional[str] = ""


class MessageRequest(BaseModel):
    """Payload for the standalone ML spam-prediction endpoint."""

    text: str = Field(..., min_length=1, description="The message text to analyse")


class SpamPredictionResponse(BaseModel):
    message: str
    data: dict


class HybridScoreResult(BaseModel):
    """Structured result from the hybrid scoring engine."""

    final_score: float
    rule_score: float
    ml_score: float
    ml_category: str
    ml_confidence: float
    priority: str
    flags: list[str]
    details: dict[str, Any]
