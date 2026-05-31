"""
dashboard.py — Dashboard analytics endpoints.

Provides pre-aggregated summary and timeline data for the admin dashboard,
offloading client-side computation to the server.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.security import require_admin
from app.core.cache import cache_result
from app.db.session import get_db
from app.modules.dashboard.repository import DashboardRepository

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
@cache_result(ttl=60)
async def get_dashboard_summary(
    status: str = Query(None),
    priority: str = Query(None),
    date_from: str = Query(None),
    date_to: str = Query(None),
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Return pre-aggregated dashboard summary, optionally filtered."""
    return DashboardRepository.summary(db, status, priority, date_from, date_to)


@router.get("/timeline")
def get_timeline(
    days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Return daily ticket counts for the last N days (admin only)."""
    return {"range": f"{days}d", "points": DashboardRepository.timeline(db, days)}
