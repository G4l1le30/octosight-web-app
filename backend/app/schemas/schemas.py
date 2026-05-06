"""
schemas.py — Pydantic request/response schemas for OctoSight API.

All external inputs are validated here before reaching service/repo layers.
"""

from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2)
    email: str
    password: str = Field(..., min_length=8)


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    full_name: str
    email: str
    role: str


# ── Tickets ───────────────────────────────────────────────────────────────────

class TicketUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    investigation_notes: Optional[str] = None


# ── Detection ─────────────────────────────────────────────────────────────────

class AnalysisRequest(BaseModel):
    """Payload for the preview analysis endpoint (no DB save)."""

    type: str
    url: Optional[str] = ""
    summary: Optional[str] = ""
    sender_numbers: Optional[str] = ""
    attachment_names: Optional[List[str]] = []


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
    flags: List[str]
    details: dict
