"""activity.py — Activity feed API endpoints (v1)."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.security import require_permission
from app.db.session import get_db
from app.modules.activity.service import ActivityService

router = APIRouter(prefix="/activity", tags=["activity"])


@router.get("")
def list_activity(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    type: str = Query(None, alias="type"),
    db: Session = Depends(get_db),
    _=Depends(require_permission("dashboard.view")),
):
    """Paginated activity feed."""
    return ActivityService.list_activity(db, page, per_page, type)
