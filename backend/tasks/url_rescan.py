"""tasks/url_rescan.py — Scheduled URL re-scanner for tickets >24h old."""

import logging
from datetime import datetime, timedelta, timezone

from celery_app import celery_app
from app.db.session import SessionLocal
from app.models.ticket import Ticket

logger = logging.getLogger("octosight.url_rescan")


@celery_app.task
def rescan_24h_tickets():
    """Find tickets with URLs created >24h ago, flag for re-check."""
    db = SessionLocal()
    try:
        cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=24)
        tickets = (
            db.query(Ticket)
            .filter(
                Ticket.created_at < cutoff,
                Ticket.url.isnot(None),
                Ticket.status.in_(["Submitted", "In Review"]),
            )
            .all()
        )

        for ticket in tickets:
            new_flag = "rescanned_24h"
            existing = ticket.flags or ""
            if new_flag not in existing:
                ticket.flags = f"{existing},{new_flag}".lstrip(",")

        db.commit()
        logger.info("Rescanned %d tickets >24h old.", len(tickets))
        return {"rescanned": len(tickets)}
    except Exception as exc:
        logger.error("URL rescan failed: %s", exc)
        return {"error": str(exc)}
    finally:
        db.close()
