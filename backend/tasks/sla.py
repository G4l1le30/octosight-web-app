"""tasks/sla.py — Scheduled SLA breach checker."""

import logging
from datetime import datetime, timezone

from celery_app import celery_app
from app.db.session import SessionLocal
from app.models.ticket import Ticket
from app.models.user import User
from app.models.notification import Notification

logger = logging.getLogger("octosight.sla")


@celery_app.task
def check_sla_breaches():
    """Find tickets where sla_deadline < now AND NOT sla_breached,
    mark them breached, create notifications, and auto-assign
    unassigned tickets to available moderators.
    """
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        breached = (
            db.query(Ticket)
            .filter(
                Ticket.sla_deadline.isnot(None),
                Ticket.sla_deadline < now,
                Ticket.sla_breached == False,
            )
            .all()
        )

        if not breached:
            logger.info("No SLA breaches found.")
            return {"breached": 0}

        moderator = (
            db.query(User)
            .filter(User.role == "moderator")
            .order_by(User.created_at)
            .first()
        )

        for ticket in breached:
            ticket.sla_breached = True

            if not ticket.assigned_to and moderator:
                ticket.assigned_to = moderator.email

            notification = Notification(
                user_id=ticket.user_id or moderator.id if moderator else None,
                notification_type="sla_breach",
                title=f"SLA breached: Ticket {ticket.ticket_id}",
                body=f"Ticket has exceeded its SLA deadline without resolution",
                link=f"/admin/investigate/{ticket.ticket_id}",
            )
            db.add(notification)

        db.commit()
        logger.info("Marked %d tickets as SLA-breached.", len(breached))
        return {"breached": len(breached)}
    except Exception as exc:
        logger.error("SLA breach check failed: %s", exc)
        db.rollback()
        return {"error": str(exc)}
    finally:
        db.close()
