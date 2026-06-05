from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.mock_bank import MockBankTransaction


class TransactionRepository:

    @staticmethod
    def list_all(
        db: Session,
        page: int = 1,
        per_page: int = 20,
        transaction_type: Optional[str] = None,
        status: Optional[str] = None,
        flagged_only: bool = False,
        sort_by: str = "transaction_date",
        sort_dir: str = "desc",
    ) -> tuple[list[MockBankTransaction], int]:
        q = db.query(MockBankTransaction)

        if transaction_type:
            q = q.filter(MockBankTransaction.transaction_type == transaction_type.upper())
        if status:
            q = q.filter(MockBankTransaction.status == status.upper())
        if flagged_only:
            q = q.filter(MockBankTransaction.is_flagged == True)

        total = q.count()

        sort_col = getattr(MockBankTransaction, sort_by, MockBankTransaction.transaction_date)
        if sort_dir == "asc":
            q = q.order_by(sort_col.asc())
        else:
            q = q.order_by(sort_col.desc())

        rows = q.offset((page - 1) * per_page).limit(per_page).all()
        return rows, total

    @staticmethod
    def get_by_id(db: Session, transaction_id: str) -> Optional[MockBankTransaction]:
        return db.query(MockBankTransaction).filter(MockBankTransaction.id == transaction_id).first()

    @staticmethod
    def get_by_reference(db: Session, ref: str) -> Optional[MockBankTransaction]:
        return db.query(MockBankTransaction).filter(
            MockBankTransaction.reference_number.ilike(ref.strip())
        ).first()

    @staticmethod
    def create(db: Session, **kwargs) -> MockBankTransaction:
        tx = MockBankTransaction(**kwargs)
        db.add(tx)
        db.commit()
        db.refresh(tx)
        return tx

    @staticmethod
    def update(db: Session, tx: MockBankTransaction, **kwargs) -> MockBankTransaction:
        for k, v in kwargs.items():
            setattr(tx, k, v)
        tx.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(tx)
        return tx

    @staticmethod
    def flag(db: Session, tx: MockBankTransaction, reason: str, anomaly_score: float = 0.0) -> MockBankTransaction:
        tx.is_flagged = True
        tx.flag_reason = reason
        tx.anomaly_score = anomaly_score
        tx.status = "FLAGGED"
        tx.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(tx)
        return tx

    @staticmethod
    def unflag(db: Session, tx: MockBankTransaction) -> MockBankTransaction:
        tx.is_flagged = False
        tx.flag_reason = None
        tx.anomaly_score = 0.0
        tx.status = "COMPLETED"
        tx.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(tx)
        return tx
