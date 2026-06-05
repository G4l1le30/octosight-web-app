"""
anomaly_engine.py — Rule-based transaction anomaly scoring.

Scoring rules:
  1. Amount anomaly (0–40): amount > 3σ from user's historical avg
  2. Time-of-day anomaly (0–15): 11PM–5AM
  3. Rapid consecutive TX (0–20): same sender+receiver within 1 hour
  4. High velocity (0–25): >3 TX from same sender in 1 hour
  5. Foreign bank transfer (0–15): non-CIMB bank + large amount (>10M)
  6. Blacklisted account match (0–50): sender or receiver in fraud blacklist
  7. Midnight large TX (0–30): 11PM–5AM AND amount > 20M

Total score is capped at 100.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.blacklist import BlacklistedAccount
from app.models.mock_bank import MockBankTransaction


def _user_history(db: Session, sender_account: str, days: int = 90) -> list[MockBankTransaction]:
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    return db.query(MockBankTransaction).filter(
        MockBankTransaction.sender_account == sender_account,
        MockBankTransaction.transaction_date >= cutoff,
        MockBankTransaction.status.in_(["COMPLETED", "FLAGGED"]),
    ).all()


def _recent_tx(db: Session, sender_account: str, minutes: int = 60) -> list[MockBankTransaction]:
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=minutes)
    return db.query(MockBankTransaction).filter(
        MockBankTransaction.sender_account == sender_account,
        MockBankTransaction.transaction_date >= cutoff,
    ).all()


def score_transaction(
    db: Session,
    sender_account: str,
    receiver_account: Optional[str],
    receiver_bank: Optional[str],
    amount: float,
    transaction_type: str,
) -> tuple[float, list[str]]:
    """
    Compute anomaly score (0–100) and list of triggered reasons.

    Returns (score, reasons).
    """
    score = 0.0
    reasons: list[str] = []
    now = datetime.now(timezone.utc)

    # ── 1. Amount anomaly ──────────────────────────────────────────────
    history = _user_history(db, sender_account)
    if history:
        amounts = [t.amount for t in history]
        mean = sum(amounts) / len(amounts)
        variance = sum((a - mean) ** 2 for a in amounts) / len(amounts) if len(amounts) > 1 else 0
        std = variance ** 0.5
        if std > 0 and amount > mean + 3 * std:
            score += 40
            reasons.append(f"Amount ({amount:.0f}) exceeds 3σ threshold above mean ({mean:.0f})")
        elif std > 0 and amount > mean + 2 * std:
            score += 20
            reasons.append(f"Amount ({amount:.0f}) exceeds 2σ threshold above mean ({mean:.0f})")
    elif amount >= 10_000_000:
        score += 15
        reasons.append("No transaction history for user with large amount")

    # ── 2. Time-of-day anomaly ──────────────────────────────────────────
    hour = now.hour
    if 23 <= hour or hour < 5:
        score += 15
        reasons.append(f"Transaction at unusual hour ({now.strftime('%H:%M')})")

    # ── 3. Rapid consecutive TX ──────────────────────────────────────────
    recent = _recent_tx(db, sender_account, minutes=60)
    if receiver_account:
        same_receiver = [t for t in recent if t.receiver_account == receiver_account]
        if same_receiver:
            score += 20
            reasons.append(f"Rapid consecutive TX to same receiver within 60 minutes")
    if len(recent) >= 2 and not same_receiver:
        score += 10
        reasons.append(f"{len(recent)} transactions from same sender in last 60 minutes")

    # ── 4. High velocity ────────────────────────────────────────────────
    if len(recent) >= 3:
        score += 25
        reasons.append(f"High velocity: {len(recent)} TX in last 60 minutes")

    # ── 5. Foreign bank + large amount ──────────────────────────────────
    if receiver_bank and receiver_bank.upper() != "CIMB NIAGA" and amount >= 10_000_000:
        score += 15
        reasons.append(f"Large transfer to non-CIMB bank ({receiver_bank})")

    # ── 6. Blacklisted account match ────────────────────────────────────
    for acct in [sender_account, receiver_account]:
        if not acct:
            continue
        match = db.query(BlacklistedAccount).filter(
            BlacklistedAccount.account_number == acct,
            BlacklistedAccount.is_active == True,
        ).first()
        if match:
            score += 50
            reasons.append(f"Account {acct} matches fraud blacklist: {match.reason or 'No reason'}")

    # ── 7. Midnight large TX ────────────────────────────────────────────
    if (23 <= hour or hour < 5) and amount >= 20_000_000:
        score += 30
        reasons.append("Large transaction at midnight hours")

    score = min(score, 100.0)
    return score, reasons


def auto_flag_threshold(db: Session, tx: MockBankTransaction) -> tuple[bool, float, str]:
    """
    Run anomaly scoring on a transaction; return (should_flag, score, primary_reason).
    Auto-flags if score >= 50.
    """
    score, reasons = score_transaction(
        db,
        sender_account=tx.sender_account or "",
        receiver_account=tx.receiver_account,
        receiver_bank=tx.receiver_bank,
        amount=tx.amount,
        transaction_type=tx.transaction_type,
    )
    primary = reasons[0] if reasons else "No anomaly detected"
    return score >= 50, score, "; ".join(reasons) if reasons else "No anomaly detected"
