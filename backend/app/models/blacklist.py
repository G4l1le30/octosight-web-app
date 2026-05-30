"""
blacklist.py — Blacklisted entities ORM models.

URLs, Bank Accounts, Phone Numbers, and Email addresses that admins
have marked as malicious.
"""

from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text

from app.db.base import Base


class BlacklistedURL(Base):
    __tablename__ = "blacklisted_urls"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(Text, nullable=False)
    domain = Column(String(255), nullable=False, index=True)
    reason = Column(Text, nullable=True)
    ticket_id = Column(String(50), nullable=True)
    added_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class BlacklistedAccount(Base):
    __tablename__ = "blacklisted_accounts"

    id = Column(Integer, primary_key=True, index=True)
    account_number = Column(String(50), unique=True, index=True, nullable=False)
    bank_name = Column(String(100), nullable=False)
    reason = Column(Text, nullable=True)
    ticket_id = Column(String(50), nullable=True)
    added_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class BlacklistedPhone(Base):
    __tablename__ = "blacklisted_phones"

    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String(50), unique=True, index=True, nullable=False)
    reason = Column(Text, nullable=True)
    ticket_id = Column(String(50), nullable=True)
    added_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class BlacklistedEmail(Base):
    __tablename__ = "blacklisted_emails"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    reason = Column(Text, nullable=True)
    ticket_id = Column(String(50), nullable=True)
    added_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
