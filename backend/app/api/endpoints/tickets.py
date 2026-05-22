"""
routers/tickets.py — Ticket management endpoints.

Routes:
  GET   /api/v1/tickets                 List all tickets (admin only)
  GET   /api/v1/tickets/{ticket_id}     Get single ticket by ID (public)
  PATCH /api/v1/tickets/{ticket_id}     Update ticket (admin only)
  GET   /api/v1/user/tickets            List current user's tickets
  GET   /api/v1/admin/download/{file}   Download evidence file (admin only)
"""

import os

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_admin
from app.db.session import get_db
from app.models.models import Ticket, User
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
    _admin=Depends(require_admin),
):
    """
    Update ticket status, priority, or investigation notes.
    Audit trail note: admin identity is validated via JWT dependency.
    Admin only.
    """
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    old_status = ticket.status

    if update.status is not None:
        ticket.status = update.status
    if update.priority is not None:
        ticket.priority = update.priority
    if update.investigation_notes is not None:
        ticket.investigation_notes = update.investigation_notes

    db.commit()
    db.refresh(ticket)
    
    if update.status is not None and update.status != old_status:
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
                    "notes": update.investigation_notes or ""
                }
            )

    return ticket


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
    _admin=Depends(require_admin),
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
        subject=f"⚠️ OctoSight - Security Warning [{ticket.ticket_id}]",
        email_to=user.email,
        template_name="admin_warning.html",
        template_body={
            "ticket_id": ticket.ticket_id,
            "warning_message": data.message,
        }
    )
    
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
