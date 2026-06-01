"""
dashboard.py — Dashboard analytics endpoints.

Provides pre-aggregated summary and timeline data for the admin dashboard,
offloading client-side computation to the server.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.security import require_permission
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
    _=Depends(require_permission("dashboard.view")),
):
    """Return pre-aggregated dashboard summary, optionally filtered."""
    return DashboardRepository.summary(db, status, priority, date_from, date_to)


@router.get("/timeline")
def get_timeline(
    days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db),
    _=Depends(require_permission("dashboard.view")),
):
    """Return daily ticket counts for the last N days."""
    return {"range": f"{days}d", "points": DashboardRepository.timeline(db, days)}


@router.get("/team")
def get_team_summary(
    db: Session = Depends(get_db),
    _=Depends(require_permission("dashboard.view")),
):
    """Return per-assignee ticket statistics."""
    return {"team": DashboardRepository.team_summary(db)}
