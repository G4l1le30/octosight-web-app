"""triggers.py — Behavioral trigger engine: rule-based alerts on user/ticket patterns."""

from datetime import datetime, timezone, timedelta
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.ticket import Ticket
from app.models.user import User
from app.modules.notifications.service import NotificationService


class TriggerRule:
    def __init__(self, name: str, description: str, check_fn):
        self.name = name
        self.description = description
        self.check_fn = check_fn

    def evaluate(self, db: Session, **kwargs) -> Optional[dict]:
        result = self.check_fn(db, **kwargs)
        return {"rule": self.name, "description": self.description, **result} if result else None


def _check_high_frequency_reporter(db: Session, **kwargs) -> Optional[dict]:
    """Alert if a user submitted 3+ tickets in 24h."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    user_id = kwargs.get("user_id")
    if not user_id:
        return None

    count = db.query(Ticket).filter(
        Ticket.user_id == user_id,
        Ticket.created_at >= cutoff,
    ).count()

    if count >= 3:
        return {
            "severity": "high",
            "message": f"User {user_id} has submitted {count} reports in 24h — possible ongoing attack.",
            "count": count,
        }
    return None


def _check_rapid_status_change(db: Session, **kwargs) -> Optional[dict]:
    """Alert if a ticket's status changed 3+ times in 1 hour."""
    ticket_id = kwargs.get("ticket_id")
    if not ticket_id:
        return None

    from app.models.ticket import TicketAuditLog
    cutoff = datetime.now(timezone.utc) - timedelta(hours=1)
    count = db.query(TicketAuditLog).filter(
        TicketAuditLog.ticket_id == ticket_id,
        TicketAuditLog.created_at >= cutoff,
    ).count()

    if count >= 3:
        return {
            "severity": "medium",
            "message": f"Ticket {ticket_id} status changed {count} times in 1 hour.",
            "count": count,
        }
    return None


def _check_unassigned_aging(db: Session, **kwargs) -> Optional[dict]:
    """Alert if high-priority tickets remain unassigned for > 4h."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=4)
    count = db.query(Ticket).filter(
        Ticket.priority == "High",
        Ticket.assigned_to.is_(None),
        Ticket.status.in_(["Submitted", "In Review"]),
        Ticket.created_at <= cutoff,
    ).count()

    if count > 0:
        return {
            "severity": "high",
            "message": f"{count} high-priority ticket(s) unassigned for > 4 hours.",
            "count": count,
        }
    return None


def _check_sla_breach_escalation(db: Session, **kwargs) -> Optional[dict]:
    """Alert if SLA-breach count exceeds threshold."""
    count = db.query(Ticket).filter(
        Ticket.sla_breached == True,
        Ticket.status.in_(["Submitted", "In Review"]),
    ).count()

    if count >= 5:
        return {
            "severity": "critical",
            "message": f"{count} tickets have breached SLA and are still unresolved.",
            "count": count,
        }
    return None


# Registry of trigger rules
TRIGGER_RULES: list[TriggerRule] = [
    TriggerRule("high_frequency_reporter", "User submitted 3+ reports in 24h", _check_high_frequency_reporter),
    TriggerRule("rapid_status_change", "Ticket status changed 3+ times in 1h", _check_rapid_status_change),
    TriggerRule("unassigned_aging", "High-priority tickets unassigned > 4h", _check_unassigned_aging),
    TriggerRule("sla_breach_escalation", "5+ SLA-breached tickets unresolved", _check_sla_breach_escalation),
]


def evaluate_all_triggers(db: Session, **kwargs) -> list[dict]:
    """Evaluate all trigger rules and return alerts."""
    alerts = []
    for rule in TRIGGER_RULES:
        result = rule.evaluate(db, **kwargs)
        if result:
            alerts.append(result)
    return alerts


def evaluate_and_notify(db: Session, admin_ids: list[str] = None, **kwargs) -> list[dict]:
    """Evaluate triggers and send notifications for any alerts."""
    alerts = evaluate_all_triggers(db, **kwargs)

    if alerts and admin_ids:
        for admin_id in admin_ids:
            for alert in alerts:
                try:
                    NotificationService.create_notification(
                        db,
                        user_id=admin_id,
                        notification_type="trigger_alert",
                        title=f"Alert: {alert['rule']}",
                        body=alert["message"],
                    )
                except Exception:
                    pass  # Don't fail trigger evaluation on notification errors

    return alerts
