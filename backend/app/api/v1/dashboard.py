"""
dashboard.py — Dashboard analytics endpoints.

Provides pre-aggregated summary and timeline data for the admin dashboard,
offloading client-side computation to the server.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.security import require_admin
from app.core.cache import cache_result
from app.db.session import get_db
from app.modules.dashboard.repository import DashboardRepository
from app.models.ticket import Ticket
from app.models.user import User

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


@router.get("/team")
def get_team_stats(
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Per-assignee workload stats: open tickets, avg risk score, response time."""
    tickets = db.query(Ticket).all()

    assignee_data: dict[str, dict] = {}
    for t in tickets:
        assignee = t.assigned_to or "Unassigned"
        if assignee not in assignee_data:
            assignee_data[assignee] = {
                "assignee": assignee,
                "total": 0,
                "open": 0,
                "high_risk": 0,
                "risk_scores": [],
                "statuses": {},
            }
        d = assignee_data[assignee]
        d["total"] += 1
        if t.status in ("Submitted", "In Review"):
            d["open"] += 1
        if t.priority == "High":
            d["high_risk"] += 1
        if t.risk_score is not None:
            d["risk_scores"].append(t.risk_score)
        d["statuses"][t.status] = d["statuses"].get(t.status, 0) + 1

    # Fetch user names for known assignee IDs
    user_ids = [a for a in assignee_data if a != "Unassigned"]
    users = db.query(User).filter(User.id.in_(user_ids)).all() if user_ids else []
    id_to_name = {u.id: u.full_name for u in users}

    result = []
    for assignee, d in assignee_data.items():
        avg_risk = sum(d["risk_scores"]) / len(d["risk_scores"]) if d["risk_scores"] else 0
        result.append({
            "assignee": id_to_name.get(assignee, assignee),
            "assignee_id": assignee,
            "total_tickets": d["total"],
            "open_tickets": d["open"],
            "high_risk_tickets": d["high_risk"],
            "avg_risk_score": round(avg_risk, 1),
            "status_distribution": d["statuses"],
        })

    result.sort(key=lambda x: -x["total"])
    return result
