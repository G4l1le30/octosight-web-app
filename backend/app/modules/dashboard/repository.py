"""dashboard/repository.py — Analytics data access layer."""

from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.ticket import Ticket
from app.models.user import User


class DashboardRepository:
    """Aggregation queries for dashboard analytics."""

    @staticmethod
    def summary(
        db: Session,
        status: str = None,
        priority: str = None,
        date_from: str = None,
        date_to: str = None,
    ) -> dict[str, Any]:
        query = db.query(Ticket)
        if status and status != "All":
            query = query.filter(Ticket.status == status)
        if priority and priority != "All":
            query = query.filter(Ticket.priority == priority)
        if date_from:
            query = query.filter(Ticket.created_at >= datetime.fromisoformat(date_from))
        if date_to:
            query = query.filter(Ticket.created_at <= datetime.fromisoformat(date_to))
        tickets = query.all()
        total = len(tickets)

        if total == 0:
            return {
                "total_tickets": 0,
                "avg_risk_score": 0.0,
                "high_risk_count": 0,
                "medium_risk_count": 0,
                "low_risk_count": 0,
                "status_distribution": {},
                "type_distribution": {},
                "priority_distribution": {},
                "sla_breach_count": 0,
                "open_tickets_count": 0,
                "flag_distribution": [],
            }

        avg_score = sum(t.risk_score or 0 for t in tickets) / total

        status_dist: dict[str, int] = {}
        type_dist: dict[str, int] = {}
        priority_dist: dict[str, int] = {}
        flag_counter: dict[str, int] = {}

        high_risk = medium_risk = low_risk = sla_breach = open_count = 0

        for t in tickets:
            # Priority count
            if t.priority == "High":
                high_risk += 1
            elif t.priority == "Medium":
                medium_risk += 1
            elif t.priority == "Low":
                low_risk += 1

            # Status count
            s = t.status or "Unknown"
            status_dist[s] = status_dist.get(s, 0) + 1

            # Type count
            typ = t.type or "Unknown"
            type_dist[typ] = type_dist.get(typ, 0) + 1

            # Priority count
            p = t.priority or "Unknown"
            priority_dist[p] = priority_dist.get(p, 0) + 1

            # SLA breach
            if t.sla_breached:
                sla_breach += 1

            # Open tickets
            if t.status in ("Submitted", "In Review"):
                open_count += 1

            # Flag distribution
            if t.flags:
                for flag in t.flags.split(","):
                    flag = flag.strip()
                    if flag:
                        flag_counter[flag] = flag_counter.get(flag, 0) + 1

        # Sort flags by count descending
        sorted_flags = sorted(flag_counter.items(), key=lambda x: -x[1])[:20]
        flag_distribution = [{"flag": k, "count": v} for k, v in sorted_flags]

        return {
            "total_tickets": total,
            "avg_risk_score": round(avg_score, 1),
            "high_risk_count": high_risk,
            "medium_risk_count": medium_risk,
            "low_risk_count": low_risk,
            "status_distribution": status_dist,
            "type_distribution": type_dist,
            "priority_distribution": priority_dist,
            "sla_breach_count": sla_breach,
            "open_tickets_count": open_count,
            "flag_distribution": flag_distribution,
        }

    @staticmethod
    def timeline(db: Session, days: int = 7) -> list[dict[str, Any]]:
        """Return daily ticket counts for the last N days."""
        since = datetime.now(timezone.utc) - timedelta(days=days)
        tickets = (
            db.query(Ticket)
            .filter(Ticket.created_at >= since)
            .order_by(Ticket.created_at.asc())
            .all()
        )

        # Group by date
        daily: dict[str, dict] = {}
        for i in range(days):
            day = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d")
            daily[day] = {"date": day, "count": 0, "high_risk": 0}

        for t in tickets:
            day = t.created_at.strftime("%Y-%m-%d") if t.created_at else ""
            if day in daily:
                daily[day]["count"] += 1
                if t.priority == "High":
                    daily[day]["high_risk"] += 1

        return sorted(daily.values(), key=lambda x: x["date"])
