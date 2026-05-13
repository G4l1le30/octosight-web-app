import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text, JSON

from app.db.session import Base


class User(Base):
    """Registered user account. Role is 'user' or 'admin'."""

    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="user")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )


class Ticket(Base):
    """Phishing / fraud report ticket submitted by a user."""

    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(String(50), unique=True, index=True)
    url = Column(Text)
    type = Column(String(50))
    summary = Column(Text)

    # Risk scoring
    risk_score = Column(Float)
    rule_score = Column(Float, nullable=True)   # raw rule-engine score (0-100)
    ml_score = Column(Float, nullable=True)     # raw ML-engine score (0-100)

    status = Column(String(50), default="Submitted")
    priority = Column(String(50))
    flags = Column(Text)
    investigation_notes = Column(Text)

    # Report content
    sender_numbers = Column(Text)
    extracted_text = Column(Text)
    attachment_names = Column(Text)
    attachment_paths = Column(Text)
    screenshot_paths = Column(Text)

    # Detailed analysis JSON
    analysis_results = Column(Text)
    
    # Education recommendations
    education_recommendation = Column(JSON, nullable=True)

    # Relationships
    user_id = Column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )
