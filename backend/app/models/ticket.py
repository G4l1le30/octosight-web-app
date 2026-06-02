"""
ticket.py — Ticket ORM model and TicketAuditLog.

Core entity representing a phishing/fraud report submitted by a user.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, JSON, String, Text

from app.db.base import Base


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id = Column(String(50), unique=True, index=True)
    url = Column(Text)
    type = Column(String(50))
    summary = Column(Text)

    # Risk scoring
    risk_score = Column(Float)
    rule_score = Column(Float, nullable=True)
    ml_score = Column(Float, nullable=True)

    status = Column(String(50), default="Submitted")
    priority = Column(String(50))
    flags = Column(Text)
    investigation_notes = Column(Text)

    # Advanced Information
    bank_name = Column(String(100), nullable=True)
    bank_account = Column(String(50), nullable=True)
    reference_number = Column(String(100), nullable=True)

    # Report content
    sender_numbers = Column(Text)
    extracted_text = Column(Text)
    attachment_paths = Column(Text)
    screenshot_paths = Column(Text)

    # Detailed analysis JSON
    analysis_results = Column(Text)

    # Education recommendations
    education_recommendation = Column(JSON, nullable=True)

    # SLA management
    sla_deadline = Column(DateTime, nullable=True)
    sla_breached = Column(Boolean, default=False)

    # Attack similarity embedding (JSON array of float vector)
    embedding = Column(Text, nullable=True)

    # Assignment
    assigned_to = Column(String(255), nullable=True)
    assigned_at = Column(DateTime, nullable=True)

    # Relationships
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class TicketAuditLog(Base):
    __tablename__ = "ticket_audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id = Column(String(50), ForeignKey("tickets.ticket_id", ondelete="CASCADE"), nullable=False, index=True)
    admin_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action_taken = Column(String(255), nullable=False)
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
