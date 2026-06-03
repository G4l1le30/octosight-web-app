"""tickets/repository.py — Ticket and TicketAuditLog data access layer."""

from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.ticket import Ticket, TicketAuditLog
from app.models.user import User


class TicketRepository:
    """Database queries for the Ticket model."""

    @staticmethod
    def get_by_id(db: Session, ticket_id: str) -> Optional[Ticket]:
        return db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()

    @staticmethod
    def get_by_pk(db: Session, pk: int) -> Optional[Ticket]:
        return db.query(Ticket).filter(Ticket.id == pk).first()

    @staticmethod
    def list_all(
        db: Session,
        page: int = 1,
        per_page: int = 20,
        sort_by: str = "risk_score",
        sort_dir: str = "desc",
        status: Optional[str] = None,
        priority: Optional[str] = None,
        assigned_to: Optional[str] = None,
    ) -> tuple[list[Ticket], int]:
        """Return paginated, filtered, sorted tickets + total count."""
        query = db.query(Ticket)

        if status:
            query = query.filter(Ticket.status == status)
        if priority:
            query = query.filter(Ticket.priority == priority)
        if assigned_to:
            query = query.filter(Ticket.assigned_to == assigned_to)

        total = query.count()

        sort_column = getattr(Ticket, sort_by, Ticket.risk_score)
        order_fn = desc if sort_dir == "desc" else lambda c: c.asc()
        query = query.order_by(order_fn(sort_column))

        offset = (page - 1) * per_page
        items = query.offset(offset).limit(per_page).all()

        return items, total

    @staticmethod
    def list_by_user(
        db: Session, user_id: str, page: int = 1, per_page: int = 20
    ) -> tuple[list[Ticket], int]:
        query = (
            db.query(Ticket)
            .filter(Ticket.user_id == user_id)
            .order_by(Ticket.created_at.desc())
        )
        total = query.count()
        offset = (page - 1) * per_page
        items = query.offset(offset).limit(per_page).all()
        return items, total

    @staticmethod
    def create(db: Session, **kwargs) -> Ticket:
        ticket = Ticket(**kwargs)
        db.add(ticket)
        db.commit()
        db.refresh(ticket)
        return ticket

    @staticmethod
    def update(db: Session, ticket: Ticket, **kwargs) -> Ticket:
        for key, value in kwargs.items():
            setattr(ticket, key, value)
        db.commit()
        db.refresh(ticket)
        return ticket

    @staticmethod
    def bulk_update(
        db: Session, ticket_ids: list[int], **kwargs
    ) -> int:
        """Update multiple tickets. Returns count of updated rows."""
        updated = db.query(Ticket).filter(Ticket.id.in_(ticket_ids)).update(
            kwargs, synchronize_session="fetch"
        )
        db.commit()
        return updated

    @staticmethod
    def check_sla_breach(ticket: Ticket) -> bool:
        """Check and set SLA breach flag. Returns True if breached."""
        if ticket.sla_deadline and not ticket.sla_breached:
            if datetime.now(timezone.utc).replace(tzinfo=None) > ticket.sla_deadline and ticket.status in ("Submitted", "In Review"):
                ticket.sla_breached = True
                return True
        return False


class AuditLogRepository:
    """Database queries for TicketAuditLog."""

    @staticmethod
    def create(
        db: Session,
        ticket_id: str,
        admin_id: str,
        action_taken: str,
        old_status: Optional[str] = None,
        new_status: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> TicketAuditLog:
        entry = TicketAuditLog(
            ticket_id=ticket_id,
            admin_id=admin_id,
            action_taken=action_taken,
            old_status=old_status,
            new_status=new_status,
            notes=notes,
        )
        db.add(entry)
        db.commit()
        return entry

    @staticmethod
    def get_for_ticket(db: Session, ticket_id: str) -> list[dict[str, Any]]:
        logs = (
            db.query(TicketAuditLog)
            .filter(TicketAuditLog.ticket_id == ticket_id)
            .order_by(TicketAuditLog.created_at.asc())
            .all()
        )
        result = []
        for log in logs:
            admin_name = "System"
            if log.admin_id:
                admin_user = db.query(User).filter(User.id == log.admin_id).first()
                if admin_user:
                    admin_name = admin_user.full_name
            result.append({
                "id": log.id,
                "ticket_id": log.ticket_id,
                "admin_id": log.admin_id,
                "admin_name": admin_name,
                "action_taken": log.action_taken,
                "old_status": log.old_status,
                "new_status": log.new_status,
                "notes": log.notes,
                "created_at": log.created_at.replace(tzinfo=timezone.utc).isoformat()
                if log.created_at else None,
            })
        return result
