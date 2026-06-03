"""
transactions.py — Transaction CRUD and anomaly detection endpoints.

Endpoints:
  GET    /api/v1/transactions         — List transactions (paginated, filterable)
  GET    /api/v1/transactions/{id}    — Get single transaction
  POST   /api/v1/transactions         — Create a new transaction
  PATCH  /api/v1/transactions/{id}/flag   — Flag a transaction
  PATCH  /api/v1/transactions/{id}/unflag — Unflag a transaction
  GET    /api/v1/transactions/anomalies    — List flagged/anomalous transactions
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.security import require_permission
from app.db.session import get_db
from app.modules.transactions.service import TransactionService

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("")
def list_transactions(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    transaction_type: str = Query(None),
    status: str = Query(None),
    flagged_only: bool = Query(False),
    sort_by: str = Query("transaction_date"),
    sort_dir: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
    _=Depends(require_permission("tickets.view")),
):
    data, total = TransactionService.list_transactions(
        db, page, per_page, transaction_type, status, flagged_only, sort_by, sort_dir,
    )
    return {"data": data, "total": total, "page": page, "per_page": per_page}


@router.get("/anomalies")
def list_anomalies(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _=Depends(require_permission("dashboard.view")),
):
    data, total = TransactionService.get_anomalies(db, page, per_page)
    return {"data": data, "total": total, "page": page, "per_page": per_page}


@router.get("/{transaction_id}")
def get_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_permission("tickets.view")),
):
    tx = TransactionService.get_transaction(db, transaction_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx


@router.post("", status_code=201)
def create_transaction(
    body: dict,
    db: Session = Depends(get_db),
    _=Depends(require_permission("tickets.create")),
):
    tx = TransactionService.create_transaction(db, **body)
    return tx


@router.patch("/{transaction_id}/flag")
def flag_transaction(
    transaction_id: str,
    body: dict,
    db: Session = Depends(get_db),
    _=Depends(require_permission("tickets.edit")),
):
    reason = body.get("reason", "Flagged by admin")
    score = body.get("anomaly_score", 0.0)
    tx = TransactionService.flag_transaction(db, transaction_id, reason, score)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx


@router.patch("/{transaction_id}/unflag")
def unflag_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_permission("tickets.edit")),
):
    tx = TransactionService.unflag_transaction(db, transaction_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx
