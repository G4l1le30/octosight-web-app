"""
url_scanner.py — Proactive URL Scanner endpoints.

Endpoints:
  POST /api/v1/admin/scan-tickets  — Trigger scan of all due tickets
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import require_permission
from app.db.session import get_db
from app.services.url_scanner import scan_all_due_tickets

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/scan-tickets")
def trigger_url_scan(
    db: Session = Depends(get_db),
    _=Depends(require_permission("tickets.edit")),
):
    results = scan_all_due_tickets(db, older_than_hours=24)

    scanned = len(results)
    live = sum(1 for r in results if r.get("live"))
    escalated = sum(1 for r in results if r.get("escalated"))

    return {
        "scanned": scanned,
        "live_urls": live,
        "escalated": escalated,
        "results": results,
    }
