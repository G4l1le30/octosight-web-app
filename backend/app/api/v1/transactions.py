"""transactions.py — Mock transaction CRUD + anomaly detection endpoints (v1)."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.core.security import require_admin
from app.db.session import get_db
from app.models.mock_bank import MockBankTransaction

router = APIRouter(prefix="/transactions", tags=["transactions"])


class TransactionCreate(BaseModel):
    reference_number: str
    sender_name: str
    sender_account: Optional[str] = None
    sender_bank: Optional[str] = None
    receiver_account: Optional[str] = None
    receiver_bank: Optional[str] = None
    amount: float


class TransactionUpdate(BaseModel):
    sender_name: Optional[str] = None
    sender_account: Optional[str] = None
    sender_bank: Optional[str] = None
    receiver_account: Optional[str] = None
    receiver_bank: Optional[str] = None
    amount: Optional[float] = None


@router.get("")
def list_transactions(
    page: int = 1,
    per_page: int = 20,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    total = db.query(MockBankTransaction).count()
    items = (
        db.query(MockBankTransaction)
        .order_by(MockBankTransaction.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    return {
        "items": [
            {
                "id": t.id,
                "reference_number": t.reference_number,
                "sender_name": t.sender_name,
                "sender_account": t.sender_account,
                "sender_bank": t.sender_bank,
                "receiver_account": t.receiver_account,
                "receiver_bank": t.receiver_bank,
                "amount": t.amount,
                "transaction_date": t.transaction_date.isoformat() if t.transaction_date else None,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in items
        ],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
    }


@router.post("")
def create_transaction(
    body: TransactionCreate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    existing = db.query(MockBankTransaction).filter(
        MockBankTransaction.reference_number == body.reference_number
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Reference number already exists")
    tx = MockBankTransaction(
        reference_number=body.reference_number,
        sender_name=body.sender_name,
        sender_account=body.sender_account,
        sender_bank=body.sender_bank,
        receiver_account=body.receiver_account,
        receiver_bank=body.receiver_bank,
        amount=body.amount,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return {"id": tx.id, "message": "Transaction created"}


@router.patch("/{tx_id}")
def update_transaction(
    tx_id: int,
    body: TransactionUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    tx = db.query(MockBankTransaction).filter(MockBankTransaction.id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    for field, val in body.model_dump(exclude_unset=True).items():
        setattr(tx, field, val)
    db.commit()
    return {"message": "Transaction updated"}


@router.delete("/{tx_id}")
def delete_transaction(
    tx_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    tx = db.query(MockBankTransaction).filter(MockBankTransaction.id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(tx)
    db.commit()
    return {"message": "Transaction deleted"}


# ── Anomaly Detection ────────────────────────────────────────────────────────

class AnomalyRequest(BaseModel):
    amount: float
    sender_account: Optional[str] = None
    receiver_account: Optional[str] = None
    hour_of_day: Optional[int] = None


@router.post("/analyze")
def analyze_transaction_anomaly(
    body: AnomalyRequest,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Rule-based anomaly scoring for a transaction."""
    factors = []
    score = 0

    # Factor 1: High amount (> 2M)
    if body.amount > 2_000_000:
        score += 40
        factors.append({"factor": "high_amount", "detail": f"Amount {body.amount:,.0f} exceeds 2M threshold", "weight": 40})
    elif body.amount > 1_000_000:
        score += 20
        factors.append({"factor": "elevated_amount", "detail": f"Amount {body.amount:,.0f} exceeds 1M", "weight": 20})

    # Factor 2: Unusual hour (22:00 - 05:00)
    hour = body.hour_of_day
    if hour is not None and (hour >= 22 or hour < 5):
        score += 25
        factors.append({"factor": "unusual_hour", "detail": f"Transaction at {hour}:00 (off-hours)", "weight": 25})

    # Factor 3: Sender account history
    if body.sender_account:
        recent_count = (
            db.query(MockBankTransaction)
            .filter(MockBankTransaction.sender_account == body.sender_account)
            .count()
        )
        if recent_count > 5:
            score += 15
            factors.append({"factor": "high_frequency", "detail": f"Sender account has {recent_count} prior transactions", "weight": 15})

    # Factor 4: Round number (suspicious)
    if body.amount > 0 and body.amount % 100000 == 0 and body.amount >= 500000:
        score += 10
        factors.append({"factor": "round_amount", "detail": "Round amount (multiples of 100K)", "weight": 10})

    # Cap at 100
    score = min(score, 100)

    risk_level = "low"
    if score >= 70:
        risk_level = "high"
    elif score >= 40:
        risk_level = "medium"

    return {
        "anomaly_score": score,
        "risk_level": risk_level,
        "factors": factors,
        "recommendation": "Block and investigate" if risk_level == "high" else ("Monitor" if risk_level == "medium" else "No action needed"),
    }
