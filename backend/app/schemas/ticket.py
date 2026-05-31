"""ticket.py — Pydantic schemas for tickets and audit logs."""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class TicketResponse(BaseModel):
    id: int
    ticket_id: Optional[str] = None
    url: Optional[str] = None
    type: Optional[str] = None
    summary: Optional[str] = None
    risk_score: Optional[float] = None
    rule_score: Optional[float] = None
    ml_score: Optional[float] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    flags: Optional[str] = None
    investigation_notes: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    reference_number: Optional[str] = None
    sender_numbers: Optional[str] = None
    extracted_text: Optional[str] = None
    attachment_paths: Optional[str] = None
    screenshot_paths: Optional[str] = None
    analysis_results: Any = None
    education_recommendation: Any = None
    sla_deadline: Optional[datetime] = None
    sla_breached: bool = False
    user_id: Optional[str] = None
    assigned_to: Optional[str] = None
    assigned_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TicketUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    investigation_notes: Optional[str] = None
    action_taken: Optional[str] = None


class TicketAssign(BaseModel):
    assigned_to: str


class BulkTicketUpdate(BaseModel):
    ticket_ids: list[int]
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[str] = None


class AuditLogResponse(BaseModel):
    id: int
    ticket_id: str
    admin_id: Optional[str] = None
    action_taken: str
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TicketFeedbackCreate(BaseModel):
    feedback_type: str  # fp, tp, fn, tn
    notes: Optional[str] = None
