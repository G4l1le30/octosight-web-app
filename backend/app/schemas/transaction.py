"""transaction.py — Pydantic schemas for mock bank transactions."""

from typing import Optional

from pydantic import BaseModel, Field


class CreateTransactionRequest(BaseModel):
    sender_name: Optional[str] = ""
    sender_account: Optional[str] = ""
    sender_bank: Optional[str] = ""
    receiver_account: Optional[str] = ""
    receiver_bank: Optional[str] = ""
    amount: float = Field(..., gt=0)
    transaction_type: str = "TRANSFER"
    description: Optional[str] = ""
    reference_number: Optional[str] = ""


class FlagTransactionRequest(BaseModel):
    reason: str = "Flagged by admin"
    anomaly_score: float = 0.0
