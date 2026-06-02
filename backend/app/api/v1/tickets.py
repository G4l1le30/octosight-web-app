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
import os

from fastapi import APIRouter, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.security import require_permission
from app.core.exceptions import NotFoundException
from app.db.session import get_db
from app.models.user import User
from app.models.ticket import Ticket
from app.models.feedback import MLFeedback
from app.modules.notifications.service import NotificationService
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
    sla_breached: bool = None,
    db: Session = Depends(get_db),
    _=Depends(require_permission("tickets.view")),
):
    """Paginated ticket listing with filters."""
    return TicketService.list_tickets(
        db, page, per_page, sort_by, sort_dir, status, priority, assigned_to, sla_breached
    )


@router.patch("/{ticket_id}/status")
def update_ticket_status(
    ticket_id: str,
    data: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("tickets.update_status")),
):
    """Update ticket status (used by Kanban drag-and-drop)."""
    status = data.get("status")
    if not status:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="status is required")

    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket:
        raise NotFoundException("Ticket not found")

    old_status = ticket.status
    ticket.status = status
    from datetime import datetime, timezone
    ticket.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ticket)

    from app.modules.activity.service import ActivityService
    ActivityService.log_ticket_updated(
        db, current_user.id, ticket.ticket_id,
        f"Status updated via Kanban: {old_status} -> {status}",
    )

    # Create in-app notification for status change
    NotificationService.create_notification(
        db=db,
        user_id=current_user.id,
        notification_type="ticket_status_changed",
        title=f"Ticket {ticket.ticket_id} status changed",
        body=f"Status updated to {status}",
        link=f"/admin/investigate/{ticket.ticket_id}",
    )

    # Email notification to ticket reporter
    from app.models.user import User as UserModel
    reporter = db.query(UserModel).filter(UserModel.id == ticket.user_id).first()
    if reporter and reporter.email:
        from app.modules.notifications.service import send_email_notification as _send_email
        _send_email(
            background_tasks=background_tasks,
            subject=f"OctoSight - Report Status Update [{ticket.ticket_id}]",
            email_to=reporter.email,
            template_name="status_change.html",
            template_body={
                "ticket_id": ticket.ticket_id,
                "type": ticket.type or "N/A",
                "url": ticket.url or "N/A",
                "sender_numbers": ticket.sender_numbers or "N/A",
                "summary": (ticket.summary or "")[:300],
                "risk_score": ticket.risk_score,
                "priority": ticket.priority,
                "bank_name": ticket.bank_name or "",
                "bank_account": ticket.bank_account or "",
                "reference_number": ticket.reference_number or "",
                "old_status": old_status,
                "new_status": status,
                "notes": "",
            },
        )

    return {"status": "updated", "ticket_id": ticket.ticket_id, "new_status": ticket.status}


@router.post("/{ticket_id}/assign")
def assign_ticket(
    ticket_id: str,
    data: TicketAssign,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("tickets.assign")),
):
    """Assign a ticket to a user by email and send notification."""
    from app.modules.notifications.service import send_email_notification

    ticket = TicketService.assign_ticket(db, ticket_id, data.assigned_to, current_user)

    assignee_user = db.query(User).filter(User.email == data.assigned_to).first()
    if assignee_user and assignee_user.email:
        frontend_url = os.getenv("NEXT_PUBLIC_API_URL", "http://localhost:3000").rstrip("/")
        send_email_notification(
            background_tasks=background_tasks,
            subject=f"OctoSight - Ticket Assigned [{ticket.ticket_id}]",
            email_to=assignee_user.email,
            template_name="assign_notify.html",
            template_body={
                "assignee_name": assignee_user.full_name or assignee_user.email,
                "ticket_id": ticket.ticket_id,
                "ticket_type": ticket.type or "N/A",
                "ticket_url": ticket.url or "N/A",
                "ticket_sender": ticket.sender_numbers or "N/A",
                "risk_score": ticket.risk_score or 0,
                "priority": ticket.priority or "N/A",
                "status": ticket.status or "N/A",
                "summary": (ticket.summary or "")[:300],
                "investigate_url": f"{frontend_url}/admin/investigate/{ticket.ticket_id}",
            },
        )
    
    # Create in-app notification for assignment
    NotificationService.create_notification(
        db=db,
        user_id=current_user.id,
        notification_type="ticket_assigned",
        title=f"Ticket {ticket.ticket_id} assigned",
        body=f"Assigned to {assignee_user.full_name if assignee_user else data.assigned_to}",
        link=f"/admin/investigate/{ticket.ticket_id}",
    )

    return {"status": "assigned", "ticket_id": ticket.ticket_id, "assigned_to": ticket.assigned_to}


@router.patch("/bulk")
def bulk_update_tickets(
    data: BulkTicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("tickets.bulk_update")),
):
    """Bulk update tickets (status, priority, assignment)."""
    return TicketService.bulk_update(
        db, data.ticket_ids, current_user, data.status, data.priority, data.assigned_to
    )


@router.post("/{ticket_id}/feedback")
def submit_feedback(
    ticket_id: str,
    data: TicketFeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("ml.submit_feedback")),
):
    """Submit ML feedback (FP/TP/FN/TN) for retraining pipeline."""
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

    # Create in-app notification for feedback submission
    NotificationService.create_notification(
        db=db,
        user_id=current_user.id,
        notification_type="feedback_submitted",
        title=f"Feedback submitted for ticket {ticket.ticket_id}",
        body=f"Feedback type: {data.feedback_type.upper()}",
        link=f"/admin/investigate/{ticket.ticket_id}",
    )

    from app.modules.gamification.service import GamificationService
    GamificationService.add_points_and_check_achievements(
        db, current_user.id, 5, "feedback"
    )

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
    _=Depends(require_permission("tickets.export")),
):
    """Export filtered tickets as CSV."""
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
