"""
tickets.py — Ticket management API endpoints (v1).

This file contains the new endpoints added in Phase 1:
- Paginated ticket listing
- Ticket assignment
- Bulk operations
- ML feedback collection
- CSV export

The legacy CRUD endpoints remain in api/endpoints/tickets.py
for backward compatibility.
"""

import csv
import io

from fastapi import APIRouter, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_admin
from app.core.exceptions import NotFoundException
from app.db.session import get_db
from app.models.user import User
from app.models.ticket import Ticket
from app.models.feedback import MLFeedback
from app.schemas.ticket import (
    TicketAssign,
    BulkTicketUpdate,
    TicketFeedbackCreate,
)
from app.modules.tickets.service import TicketService

router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.get("")
def list_tickets(
    page: int = 1,
    per_page: int = 20,
    sort_by: str = "risk_score",
    sort_dir: str = "desc",
    status: str = None,
    priority: str = None,
    assigned_to: str = None,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Paginated ticket listing with filters (admin only)."""
    return TicketService.list_tickets(
        db, page, per_page, sort_by, sort_dir, status, priority, assigned_to
    )


@router.post("/{ticket_id}/assign")
def assign_ticket(
    ticket_id: str,
    data: TicketAssign,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Assign a ticket to a user (admin only)."""
    ticket = TicketService.assign_ticket(db, ticket_id, data.assigned_to, admin)
    return {"status": "assigned", "ticket_id": ticket.ticket_id, "assigned_to": ticket.assigned_to}


@router.patch("/bulk")
def bulk_update_tickets(
    data: BulkTicketUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Bulk update tickets (status, priority, assignment) — admin only."""
    return TicketService.bulk_update(
        db, data.ticket_ids, admin, data.status, data.priority, data.assigned_to
    )


@router.post("/{ticket_id}/feedback")
def submit_feedback(
    ticket_id: str,
    data: TicketFeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Submit ML feedback (FP/TP/FN/TN) for retraining pipeline (admin only)."""
    from app.models.ticket import Ticket

    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket:
        raise NotFoundException("Ticket not found")

    feedback = MLFeedback(
        ticket_id=ticket_id,
        admin_id=current_user.id,
        feedback_type=data.feedback_type,
        notes=data.notes,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    return {
        "status": "submitted",
        "feedback_id": feedback.id,
        "feedback_type": feedback.feedback_type,
    }


@router.get("/export")
def export_tickets_csv(
    status: str = None,
    priority: str = None,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Export filtered tickets as CSV (admin only)."""
    query = db.query(Ticket)
    if status and status != "All":
        query = query.filter(Ticket.status == status)
    if priority and priority != "All":
        query = query.filter(Ticket.priority == priority)

    tickets = query.order_by(Ticket.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Ticket ID", "Type", "URL", "Status", "Priority", "Risk Score",
        "Rule Score", "ML Score", "Flags", "Assigned To", "Summary",
        "Created At", "Updated At",
    ])
    for t in tickets:
        writer.writerow([
            t.ticket_id, t.type, t.url, t.status, t.priority, t.risk_score,
            t.rule_score, t.ml_score, t.flags, t.assigned_to,
            (t.summary or "")[:200], t.created_at, t.updated_at,
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=octosight_export.csv"},
    )
