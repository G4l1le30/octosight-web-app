"""mock_bank.py — Mock bank transaction model for demo/simulation."""

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, Integer, String

from app.db.base import Base


class MockBankTransaction(Base):
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
