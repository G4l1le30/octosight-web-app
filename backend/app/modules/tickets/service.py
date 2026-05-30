"""tickets/service.py — Ticket business logic."""

from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException, BadRequestException, ForbiddenException
from app.modules.tickets.repository import TicketRepository, AuditLogRepository
from app.modules.notifications.service import send_email_notification
from app.models.user import User
from app.models.ticket import Ticket


# Forward-only status progression
STATUS_ORDER: dict[str, int] = {
    "Submitted": 0,
    "In Review": 1,
    "Confirmed": 2,
    "False Positive": 3,
    "Mitigated": 3,
    "Closed": 4,
}


class TicketService:
    """Business logic for ticket management."""

    @staticmethod
    def get_ticket_or_404(db: Session, ticket_id: str) -> Ticket:
        ticket = TicketRepository.get_by_id(db, ticket_id)
        if not ticket:
            raise NotFoundException("Ticket not found")
        return ticket

    @staticmethod
    def list_tickets(
        db: Session,
        page: int = 1,
        per_page: int = 20,
        sort_by: str = "risk_score",
        sort_dir: str = "desc",
        status: Optional[str] = None,
        priority: Optional[str] = None,
        assigned_to: Optional[str] = None,
    ) -> dict[str, Any]:
        items, total = TicketRepository.list_all(
            db, page, per_page, sort_by, sort_dir, status, priority, assigned_to
        )
        for t in items:
            TicketRepository.check_sla_breach(t)
        db.commit()
        return {
            "items": items,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page if per_page > 0 else 0,
        }

    @staticmethod
    def list_user_tickets(
        db: Session, user_id: str, page: int = 1, per_page: int = 20
    ) -> dict[str, Any]:
        items, total = TicketRepository.list_by_user(db, user_id, page, per_page)
        return {
            "items": items,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page if per_page > 0 else 0,
        }

    @staticmethod
    def get_ticket_with_auth(
        db: Session, ticket_id: str, current_user: User
    ) -> Ticket:
        ticket = TicketService.get_ticket_or_404(db, ticket_id)
        if current_user.role != "admin" and ticket.user_id != current_user.id:
            raise ForbiddenException("Access denied")
        TicketRepository.check_sla_breach(ticket)
        db.commit()
        return ticket

    @staticmethod
    def update_ticket(
        db: Session,
        ticket_id: str,
        admin: User,
        background_tasks,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        investigation_notes: Optional[str] = None,
        action_taken: Optional[str] = None,
    ) -> Ticket:
        ticket = TicketService.get_ticket_or_404(db, ticket_id)
        old_status = ticket.status
        status_changed = status is not None and status != old_status

        # Forward-only status guard
        if status_changed and status is not None:
            old_order = STATUS_ORDER.get(old_status, -1)
            new_order = STATUS_ORDER.get(status, -1)
            if new_order == -1:
                raise BadRequestException(f"Invalid status: '{status}'")
            if new_order < old_order:
                raise BadRequestException(
                    f"Cannot revert status from '{old_status}' back to '{status}'. "
                    "Status progress must move forward."
                )

        # Apply updates
        updates = {}
        if status is not None:
            updates["status"] = status
        if priority is not None:
            updates["priority"] = priority
        if investigation_notes is not None:
            updates["investigation_notes"] = investigation_notes

        if updates:
            TicketRepository.update(db, ticket, **updates)

        # Audit log
        if status_changed or investigation_notes is not None:
            audit_action = (
                action_taken
                or (f"Status changed: {old_status} → {status}" if status_changed
                    else "Investigation notes updated")
            )
            AuditLogRepository.create(
                db,
                ticket_id=ticket.ticket_id,
                admin_id=admin.id,
                action_taken=audit_action,
                old_status=old_status if status_changed else None,
                new_status=status if status_changed else None,
                notes=investigation_notes,
            )

        # Email notification on status change
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
                        "notes": investigation_notes or "",
                    },
                )

        return ticket

    @staticmethod
    def assign_ticket(
        db: Session, ticket_id: str, assigned_to: str, admin: User
    ) -> Ticket:
        ticket = TicketService.get_ticket_or_404(db, ticket_id)
        ticket.assigned_to = assigned_to
        ticket.assigned_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(ticket)

        AuditLogRepository.create(
            db,
            ticket_id=ticket.ticket_id,
            admin_id=admin.id,
            action_taken=f"Assigned to user {assigned_to}",
        )
        return ticket

    @staticmethod
    def bulk_update(
        db: Session,
        ticket_ids: list[int],
        admin: User,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        assigned_to: Optional[str] = None,
    ) -> dict[str, Any]:
        updates = {}
        if status is not None:
            updates["status"] = status
        if priority is not None:
            updates["priority"] = priority
        if assigned_to is not None:
            updates["assigned_to"] = assigned_to
            updates["assigned_at"] = datetime.now(timezone.utc)

        if not updates:
            raise BadRequestException("No updates provided")

        count = TicketRepository.bulk_update(db, ticket_ids, **updates)
        return {"updated_count": count, "ticket_ids": ticket_ids}

    @staticmethod
    def notify_user(
        db: Session,
        ticket_id: str,
        message: str,
        admin: User,
        background_tasks,
    ) -> None:
        ticket = TicketService.get_ticket_or_404(db, ticket_id)
        user = db.query(User).filter(User.id == ticket.user_id).first()
        if not user or not user.email:
            raise BadRequestException("Reporter email not found")

        send_email_notification(
            background_tasks=background_tasks,
            subject=f"OctoSight - Security Warning [{ticket.ticket_id}]",
            email_to=user.email,
            template_name="admin_warning.html",
            template_body={"ticket_id": ticket.ticket_id, "warning_message": message},
        )

        AuditLogRepository.create(
            db,
            ticket_id=ticket.ticket_id,
            admin_id=admin.id,
            action_taken="Warning notification sent to reporter",
            notes=message,
        )
