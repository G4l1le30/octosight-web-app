"""mock_bank.py — Mock bank transaction model for demo/simulation."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text

from app.db.base import Base


class MockBankTransaction(Base):
    __tablename__ = "mock_bank_transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reference_number = Column(String(100), unique=True, index=True, nullable=False)
    sender_name = Column(String(255), nullable=False)
    sender_account = Column(String(50), nullable=True)
    sender_bank = Column(String(100), nullable=True)
    receiver_account = Column(String(50), nullable=True)
    receiver_bank = Column(String(100), nullable=True)
    amount = Column(Float, nullable=False)
    transaction_type = Column(String(20), default="TRANSFER")
    status = Column(String(20), default="COMPLETED")
    description = Column(Text, nullable=True)
    merchant_name = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    is_flagged = Column(Boolean, default=False)
    flag_reason = Column(Text, nullable=True)
    anomaly_score = Column(Float, default=0.0)
    transaction_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )
