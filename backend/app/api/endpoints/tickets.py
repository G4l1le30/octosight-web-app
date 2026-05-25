"""
routers/tickets.py — Ticket management endpoints.

Routes:
  GET   /api/v1/tickets                          List all tickets (admin only)
  GET   /api/v1/tickets/{ticket_id}              Get single ticket by ID (public)
  PATCH /api/v1/tickets/{ticket_id}              Update ticket (admin only)
  GET   /api/v1/tickets/{ticket_id}/audit-logs  Get audit trail (owner or admin)
  GET   /api/v1/user/tickets                     List current user's tickets
  GET   /api/v1/admin/download/{file}            Download evidence file (admin only)
"""

import os
from datetime import timezone

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_admin
from app.db.session import get_db
from app.models.models import Ticket, User, TicketAuditLog
from app.schemas.schemas import TicketUpdate
from app.modules.notifications.service import send_email_notification
from pydantic import BaseModel

class NotifyRequest(BaseModel):
    message: str

router = APIRouter(prefix="/api/v1", tags=["tickets"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")


@router.get("/tickets", summary="List all tickets (admin only)")
def get_tickets(
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Return all tickets ordered by risk score descending. Admin only."""
    return db.query(Ticket).order_by(Ticket.risk_score.desc()).all()


@router.get("/tickets/{ticket_id}", summary="Get ticket by ID (public)")
def get_ticket(ticket_id: str, db: Session = Depends(get_db)):
    """
    Public endpoint for users to track their own ticket status using the
    ticket ID they received at submission.
    """
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.patch("/tickets/{ticket_id}", summary="Update ticket (admin only)")
def update_ticket(
    ticket_id: str,
    update: TicketUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    """
    Update ticket status, priority, or investigation notes.
    Writes a TicketAuditLog entry on every change.
    Admin only.
    """
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    old_status = ticket.status
    status_changed = update.status is not None and update.status != old_status

    if update.status is not None:
        ticket.status = update.status
    if update.priority is not None:
        ticket.priority = update.priority
    if update.investigation_notes is not None:
        ticket.investigation_notes = update.investigation_notes

    # Build audit log entry
    if status_changed or update.investigation_notes is not None:
        if status_changed:
            action_label = (
                update.action_taken
                or f"Status changed: {old_status} → {update.status}"
            )
        else:
            action_label = update.action_taken or "Investigation notes updated"

        audit = TicketAuditLog(
            ticket_id=ticket.ticket_id,
            admin_id=admin.id,
            action_taken=action_label,
            old_status=old_status if status_changed else None,
            new_status=update.status if status_changed else None,
            notes=update.investigation_notes,
        )
        db.add(audit)

    db.commit()
    db.refresh(ticket)

    if status_changed:
        user = db.query(User).filter(User.id == ticket.user_id).first()
        if user and user.email:
            send_email_notification(
                background_tasks=background_tasks,
                subject=f"OctoSight - Report Status Update [{ticket.ticket_id}]",
                email_to=user.email,
                template_name="status_change.html",
                template_body={
                    "ticket_id": ticket.ticket_id,
                    "old_status": old_status,
                    "new_status": update.status,
                    "notes": update.investigation_notes or "",
                },
            )

    return ticket


@router.get("/tickets/{ticket_id}/audit-logs", summary="Get audit trail for a ticket")
def get_audit_logs(
    ticket_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Return the full chronological audit trail for a ticket.
    Accessible by the ticket reporter (matched by user_id) or any admin.
    """
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Authorization: owner or admin
    if current_user.role != "admin" and ticket.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    logs = (
        db.query(TicketAuditLog)
        .filter(TicketAuditLog.ticket_id == ticket_id)
        .order_by(TicketAuditLog.created_at.asc())
        .all()
    )

    result = []
    for log in logs:
        # Fetch admin name for display
        admin_name = "System"
        if log.admin_id:
            admin_user = db.query(User).filter(User.id == log.admin_id).first()
            if admin_user:
                admin_name = admin_user.full_name

        result.append(
            {
                "id": log.id,
                "ticket_id": log.ticket_id,
                "admin_id": log.admin_id,
                "admin_name": admin_name,
                "action_taken": log.action_taken,
                "old_status": log.old_status,
                "new_status": log.new_status,
                "notes": log.notes,
                "created_at": log.created_at.replace(tzinfo=timezone.utc).isoformat()
                if log.created_at
                else None,
            }
        )

    return result


@router.get("/user/tickets", summary="List current user's tickets")
def get_user_tickets(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Return all tickets submitted by the currently authenticated user."""
    return (
        db.query(Ticket)
        .filter(Ticket.user_id == current_user.id)
        .order_by(Ticket.created_at.desc())
        .all()
    )


@router.post("/tickets/{ticket_id}/notify", summary="Send warning to user (admin only)")
def notify_user(
    ticket_id: str,
    data: NotifyRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    """Admin endpoint to send a custom email warning to the ticket reporter."""
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    user = db.query(User).filter(User.id == ticket.user_id).first()
    if not user or not user.email:
        raise HTTPException(status_code=400, detail="Reporter email not found")

    send_email_notification(
        background_tasks=background_tasks,
        subject=f"OctoSight - Security Warning [{ticket.ticket_id}]",
        email_to=user.email,
        template_name="admin_warning.html",
        template_body={
            "ticket_id": ticket.ticket_id,
            "warning_message": data.message,
        },
    )

    # Log the warning action
    audit = TicketAuditLog(
        ticket_id=ticket.ticket_id,
        admin_id=admin.id,
        action_taken="Warning notification sent to reporter",
        notes=data.message,
    )
    db.add(audit)
    db.commit()

    return {"message": "Notification queued"}


@router.get("/admin/download/{filename}", summary="Download evidence file (admin only)")
def download_file(filename: str, _admin=Depends(require_admin)):
    """
    Stream an evidence file (screenshot or attachment) to the admin.
    Admin only.
    """
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
