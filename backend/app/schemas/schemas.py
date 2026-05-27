"""
schemas.py — Pydantic request/response schemas for OctoSight API.

All external inputs are validated here before reaching service/repo layers.
"""

from typing import List, Optional
import re

from pydantic import BaseModel, Field, field_validator


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2)
    email: str
    password: str = Field(..., min_length=8)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        if not re.search(r"[@$!%*?&#^]", v):
            raise ValueError("Password must contain at least one special character")
        return v


class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleLoginRequest(BaseModel):
    credential: str


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
    action_taken: Optional[str] = None  # Admin-supplied label e.g. "Moved to In Review"


class AuditLogResponse(BaseModel):
    id: int
    ticket_id: str
    admin_id: Optional[str] = None
    action_taken: str
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    notes: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True



# ── Detection ─────────────────────────────────────────────────────────────────

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
    flags: List[str]
    details: dict
