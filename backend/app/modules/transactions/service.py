from typing import Optional

from sqlalchemy.orm import Session

from app.core.anomaly_engine import auto_flag_threshold
from app.modules.transactions.repository import TransactionRepository


class TransactionService:

    @staticmethod
    def list_transactions(
        db: Session, page: int = 1, per_page: int = 20,
        transaction_type: Optional[str] = None, status: Optional[str] = None,
        flagged_only: bool = False, sort_by: str = "transaction_date", sort_dir: str = "desc",
    ):
        rows, total = TransactionRepository.list_all(
            db, page, per_page, transaction_type, status, flagged_only, sort_by, sort_dir,
        )
        return [
            _tx_to_dict(t) for t in rows
        ], total

    @staticmethod
    def get_transaction(db: Session, transaction_id: str):
        tx = TransactionRepository.get_by_id(db, transaction_id)
        if not tx:
            return None
        return _tx_to_dict(tx)

    @staticmethod
    def create_transaction(db: Session, **kwargs):
        tx = TransactionRepository.create(db, **kwargs)
        should_flag, anomaly_score, reason = auto_flag_threshold(db, tx)
        if should_flag:
            tx = TransactionRepository.flag(db, tx, reason, anomaly_score)
        else:
            tx.anomaly_score = anomaly_score
            db.commit()
            db.refresh(tx)
        return _tx_to_dict(tx)

    @staticmethod
    def flag_transaction(db: Session, transaction_id: str, reason: str, anomaly_score: float = 0.0):
        tx = TransactionRepository.get_by_id(db, transaction_id)
        if not tx:
            return None
        tx = TransactionRepository.flag(db, tx, reason, anomaly_score)
        return _tx_to_dict(tx)

    @staticmethod
    def unflag_transaction(db: Session, transaction_id: str):
        tx = TransactionRepository.get_by_id(db, transaction_id)
        if not tx:
            return None
        tx = TransactionRepository.unflag(db, tx)
        return _tx_to_dict(tx)

    @staticmethod
    def get_anomalies(db: Session, page: int = 1, per_page: int = 20):
        rows, total = TransactionRepository.list_all(
            db, page, per_page, flagged_only=True, sort_by="anomaly_score", sort_dir="desc",
        )
        return [_tx_to_dict(t) for t in rows], total


def _tx_to_dict(tx) -> dict:
    return {
        "id": tx.id,
        "reference_number": tx.reference_number,
        "sender_name": tx.sender_name,
        "sender_account": tx.sender_account,
        "sender_bank": tx.sender_bank,
        "receiver_account": tx.receiver_account,
        "receiver_bank": tx.receiver_bank,
        "amount": tx.amount,
        "transaction_type": tx.transaction_type,
        "status": tx.status,
        "description": tx.description,
        "merchant_name": tx.merchant_name,
        "location": tx.location,
        "is_flagged": tx.is_flagged,
        "flag_reason": tx.flag_reason,
        "anomaly_score": tx.anomaly_score,
        "transaction_date": tx.transaction_date.isoformat() if tx.transaction_date else None,
        "created_at": tx.created_at.isoformat() if tx.created_at else None,
        "updated_at": tx.updated_at.isoformat() if tx.updated_at else None,
    }
