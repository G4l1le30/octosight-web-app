"""
routers/tickets.py — Ticket management endpoints.

Routes:
  GET   /api/v1/tickets                          List all tickets (admin only)
  GET   /api/v1/tickets/{ticket_id}              Get single ticket by ID (auth + ownership)
  PATCH /api/v1/tickets/{ticket_id}              Update ticket (admin only)
  GET   /api/v1/tickets/{ticket_id}/audit-logs  Get audit trail (owner or admin)
  GET   /api/v1/user/tickets                     List current user's tickets
  GET   /api/v1/admin/download/{file}            Download evidence file (admin only)
"""

import os
import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_admin
from app.db.session import get_db
from app.models.models import Ticket, User, TicketAuditLog
from app.schemas.schemas import TicketUpdate
from app.schemas.ticket import TicketResponse
from app.modules.notifications.service import send_email_notification
from app.modules.activity.service import ActivityService
from pydantic import BaseModel

class ReportAccuracyRequest(BaseModel):
    message: str = ""

class NotifySupportRequest(BaseModel):
    message: str = ""

class NotifyRequest(BaseModel):
    message: str

router = APIRouter(prefix="/api/v1", tags=["tickets"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")

# ── Status progression order (no rollback allowed) ────────────────────────────
# Higher number = later stage. Transitions must never decrease the order index.
# "False Positive" and "Mitigated" share the same level so admins can switch
# between them (both are resolution outcomes from Confirmed).
STATUS_ORDER: dict[str, int] = {
    "Submitted":     0,
    "In Review":     1,
    "Confirmed":     2,
    "False Positive": 3,
    "Mitigated":     3,
    "Closed":        4,
}


def _check_sla_breach(ticket: Ticket) -> None:
    """Mark ticket as SLA-breached if deadline has passed and status is still pending."""
    if ticket.sla_deadline and not ticket.sla_breached:
        if datetime.now(timezone.utc).replace(tzinfo=None) > ticket.sla_deadline and ticket.status in ("Submitted", "In Review"):
            ticket.sla_breached = True


@router.get("/tickets/{ticket_id}", summary="Get ticket by ID (authenticated, own ticket)")
def get_ticket(
    ticket_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Retrieve a ticket by its public ID.
    - Admins can view any ticket.
    - Regular users can only view their own tickets.
    - Unauthenticated requests are rejected (401).
    """
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if current_user.role != "admin" and ticket.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    _check_sla_breach(ticket)
    db.commit()
    return TicketResponse.model_validate(ticket).model_dump()


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
    Status transitions must be forward-only (no rollback to previous states).
    Admin only.
    """
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    old_status = ticket.status
    status_changed = update.status is not None and update.status != old_status

    # ── Linear status guard ───────────────────────────────────────────────────
    if status_changed and update.status is not None:
        old_order = STATUS_ORDER.get(old_status, -1)
        new_order = STATUS_ORDER.get(update.status, -1)
        if new_order == -1:
            raise HTTPException(status_code=400, detail=f"Invalid status: '{update.status}'")
        if new_order < old_order:
            raise HTTPException(
                status_code=422,
                detail=f"Cannot revert status from '{old_status}' back to '{update.status}'. Status progress must move forward.",
            )
    # ─────────────────────────────────────────────────────────────────────────

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
        ActivityService.log_ticket_updated(
            db, admin.id, ticket.ticket_id,
            f"Status changed: {old_status} → {update.status} by {admin.full_name}",
        )
        user = db.query(User).filter(User.id == ticket.user_id).first()
        if user and user.email:
            send_email_notification(
                background_tasks=background_tasks,
                subject=f"OctoSight - Report Status Update [{ticket.ticket_id}]",
                email_to=user.email,
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
                    "new_status": update.status,
                    "notes": update.investigation_notes or "",
                },
            )

    return ticket


@router.post("/tickets/{ticket_id}/generate-notes", summary="Generate AI investigation notes (admin only)")
def generate_notes(
    ticket_id: str,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """
    Call Gemini AI to generate a suggested investigation note for this ticket,
    using the full ticket context (type, risk scores, flags, summary, extracted text).
    Admin only.
    """
    import json as _json
    from app.modules.education.gemini.client import GeminiClient
    from app.modules.education.gemini.service import GeminiEducationService

    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Build rich context string for the prompt
    flags_list = (ticket.flags or "").replace(",", ", ")
    analysis = {}
    try:
        analysis = _json.loads(ticket.analysis_results or "{}")
    except Exception:
        pass
    hybrid = analysis.get("hybrid_scoring", {})

    prompt = f"""You are an expert cybersecurity analyst writing investigation notes on behalf of a bank's anti-phishing team.
        Generate a concise, professional note (3-4 short sentences) to be shown to the user who submitted this report.
        The note should:
        1. Confirm what was found and the risk level.
        2. Explain the nature of the threat (e.g. phishing, brand impersonation, scam).
        3. Give clear, actionable advice for the USER to protect themselves (e.g. do not interact, do not share credentials, contact the bank directly).
        DO NOT recommend internal admin actions (no takedown, no blocklist, no escalation).
        DO NOT use first-person voice (no "I", "my", "we").
        DO NOT use markdown. Write plain text only.

        TICKET CONTEXT:
        - Ticket ID      : {ticket.ticket_id}
        - Report Type    : {ticket.type}
        - URL/Indicator  : {ticket.url or 'N/A'}
        - Sender         : {ticket.sender_numbers or 'N/A'}
        - Bank / Account : {ticket.bank_name or 'N/A'} / {ticket.bank_account or 'N/A'}
        - Final Risk Score: {ticket.risk_score}% (Priority: {ticket.priority})
        - Rule Score     : {hybrid.get('rule_score', ticket.rule_score or 'N/A')}%
        - ML Score       : {hybrid.get('ml_score', ticket.ml_score or 'N/A')}% ({hybrid.get('ml_category', 'N/A')})
        - Active Flags   : {flags_list or 'None'}
        - User Summary   : {ticket.summary or 'N/A'}
        - OCR Extracted  : {(ticket.extracted_text or '')[:600] or 'N/A'}
        - Current Status : {ticket.status}

        Generate the investigation note now:"""

    # Try Gemini, fall back to a template note
    max_retries = 3
    for attempt in range(1, max_retries + 1):
        try:
            client = GeminiClient.get_client()
            if not client or GeminiClient.is_circuit_open():
                break
            from google.genai import types as gtypes  # type: ignore
            model = GeminiClient.get_model()
            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config=gtypes.GenerateContentConfig(
                    safety_settings=[
                        gtypes.SafetySetting(category='HARM_CATEGORY_DANGEROUS_CONTENT', threshold='BLOCK_NONE'),
                    ]
                )
            )
            suggestion = response.text.strip()
            if suggestion:
                return {"suggestion": suggestion}
            break  # empty response, don't retry
        except Exception as e:
            err = str(e)
            if "503" in err or "UNAVAILABLE" in err:
                GeminiClient.rotate_model_on_overload(retry_delay_seconds=15.0)
                if attempt < max_retries:
                    wait = 2 ** attempt
                    print(f"[Gemini Notes] 503 on model {model}, retry {attempt}/{max_retries} after {wait}s")
                    time.sleep(wait)
                    continue
            elif "429" in err or "RESOURCE_EXHAUSTED" in err:
                GeminiClient.rotate_key_on_exhaustion(GeminiClient.extract_retry_delay(Exception(err)))
                if attempt < max_retries:
                    wait = 2 ** attempt
                    print(f"[Gemini Notes] 429 on key, retry {attempt}/{max_retries} after {wait}s")
                    time.sleep(wait)
                    continue
            print(f"[Gemini Notes] Error: {err}")
            break

    # Fallback: deterministic template (user-facing)
    risk_word = "high" if ticket.risk_score >= 70 else "moderate" if ticket.risk_score >= 35 else "low"
    action_advice = (
        "Do not interact with the reported content, avoid clicking any links, and do not share any personal or banking credentials."
        if ticket.risk_score >= 70
        else "Exercise caution and avoid interacting with the reported content until the investigation is complete."
    )
    fallback = (
        f"The reported {ticket.type.lower()} ({ticket.url or ticket.sender_numbers or 'indicator'}) "
        f"has been assessed as a {risk_word}-risk threat with a risk score of {ticket.risk_score}%. "
        f"Active threat indicators: {flags_list or 'none'}. "
        f"{action_advice} "
        f"If any personal or financial information has already been shared, please contact your bank immediately and change your credentials."
    )
    return {"suggestion": fallback}


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


@router.get("/user/tickets", response_model=list[TicketResponse], summary="List current user's tickets")
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


@router.post("/tickets/{ticket_id}/report-accuracy", summary="Report accuracy issue to admin")
def report_accuracy(
    ticket_id: str,
    data: ReportAccuracyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send email to admin reporting an accuracy issue with the analysis."""
    admin_email = "octosight.id@gmail.com"
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    ticket_info = f"{ticket.type} - {ticket.url or ticket.sender_numbers or 'N/A'}" if ticket else "Unknown"
    send_email_notification(
        background_tasks=BackgroundTasks(),
        subject=f"OctoSight - Accuracy Issue Reported [{ticket_id}]",
        email_to=admin_email,
        template_name="report_accuracy.html",
        template_body={
            "ticket_id": ticket_id,
            "reporter_name": current_user.full_name,
            "reporter_email": current_user.email,
            "ticket_info": ticket_info,
            "message": data.message or "No additional details provided.",
        },
    )
    return {"status": "sent", "to": admin_email}


@router.post("/tickets/{ticket_id}/notify-support", summary="Notify support about ticket")
def notify_support(
    ticket_id: str,
    data: NotifySupportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send email to admin requesting support/intervention."""
    admin_email = "octosight.id@gmail.com"
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    ticket_info = f"{ticket.type} - {ticket.url or ticket.sender_numbers or 'N/A'}" if ticket else "Unknown"
    send_email_notification(
        background_tasks=BackgroundTasks(),
        subject=f"OctoSight - Support Request [{ticket_id}]",
        email_to=admin_email,
        template_name="notify_support.html",
        template_body={
            "ticket_id": ticket_id,
            "reporter_name": current_user.full_name,
            "reporter_email": current_user.email,
            "ticket_info": ticket_info,
            "message": data.message or "Requesting admin attention on this ticket.",
        },
    )
    return {"status": "sent", "to": admin_email}


@router.get("/admin/download/{filename:path}", summary="Download evidence file (admin only)")
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
