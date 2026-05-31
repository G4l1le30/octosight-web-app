"""triggers.py — Trigger evaluation API endpoint (v1)."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import require_admin
from app.core.triggers import evaluate_all_triggers
from app.db.session import get_db

router = APIRouter(prefix="/triggers", tags=["triggers"])


@router.get("/evaluate")
def evaluate_triggers(
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Evaluate all behavioral trigger rules and return active alerts."""
    alerts = evaluate_all_triggers(db)
    return {
        "alerts": alerts,
        "count": len(alerts),
    }
