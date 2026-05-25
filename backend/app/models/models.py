import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text, JSON, Boolean

from app.db.session import Base


class User(Base):
    """Registered user account. Role is 'user' or 'admin'."""

    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="user")
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
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

    # Advanced Information
    bank_name = Column(String(100), nullable=True)
    bank_account = Column(String(50), nullable=True)
    reference_number = Column(String(100), nullable=True)

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


class BlacklistedURL(Base):
    """Internally blacklisted URLs/domains added by admins during investigation."""

    __tablename__ = "blacklisted_urls"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(Text, nullable=False)
    domain = Column(String(255), nullable=False, index=True)
    reason = Column(Text, nullable=True)
    ticket_id = Column(String(50), nullable=True)   # linked ticket, if any
    added_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )


class BlacklistedAccount(Base):
    """Internally blacklisted Bank Accounts / E-Wallets."""

    __tablename__ = "blacklisted_accounts"

    id = Column(Integer, primary_key=True, index=True)
    account_number = Column(String(50), unique=True, index=True, nullable=False)
    bank_name = Column(String(100), nullable=False)
    reason = Column(Text, nullable=True)
    ticket_id = Column(String(50), nullable=True)   # linked ticket, if any
    added_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )


class BlacklistedPhone(Base):
    """Internally blacklisted Phone Numbers."""

    __tablename__ = "blacklisted_phones"

    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String(50), unique=True, index=True, nullable=False)
    reason = Column(Text, nullable=True)
    ticket_id = Column(String(50), nullable=True)   # linked ticket, if any
    added_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )


class BlacklistedEmail(Base):
    """Internally blacklisted Email Addresses."""

    __tablename__ = "blacklisted_emails"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    reason = Column(Text, nullable=True)
    ticket_id = Column(String(50), nullable=True)   # linked ticket, if any
    added_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )


class MockBankTransaction(Base):
    """Dummy transaction data for verifying receipt validity."""

    __tablename__ = "mock_bank_transactions"

    id = Column(Integer, primary_key=True, index=True)
    reference_number = Column(String(100), unique=True, index=True, nullable=False)
    sender_name = Column(String(255), nullable=False)
    sender_account = Column(String(50), nullable=True)
    sender_bank = Column(String(100), nullable=True)
    receiver_account = Column(String(50), nullable=True)
    receiver_bank = Column(String(100), nullable=True)
    amount = Column(Float, nullable=False)
    transaction_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class TicketAuditLog(Base):
    """Audit log tracking ticket history and status transitions."""

    __tablename__ = "ticket_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(String(50), ForeignKey("tickets.ticket_id", ondelete="CASCADE"), nullable=False, index=True)
    admin_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action_taken = Column(String(255), nullable=False)
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

