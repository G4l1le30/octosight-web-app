"""activity/service.py — Activity feed business logic."""

from typing import Any, Optional

from sqlalchemy.orm import Session

from app.modules.activity.repository import ActivityLogRepository


class ActivityService:
    """Business logic for the activity feed."""

    @staticmethod
    def list_activity(
        db: Session,
        page: int = 1,
        per_page: int = 50,
        activity_type: Optional[str] = None,
    ) -> dict[str, Any]:
        items, total = ActivityLogRepository.list(db, page, per_page, activity_type)
        return {
            "items": items,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page if per_page > 0 else 0,
        }

    @staticmethod
    def log_ticket_created(
        db: Session, actor_id: str, ticket_id: str, description: str
    ) -> None:
        ActivityLogRepository.create(
            db,
            activity_type="ticket_created",
            description=description,
            actor_id=actor_id,
            ticket_id=ticket_id,
        )

    @staticmethod
    def log_ticket_updated(
        db: Session, actor_id: str, ticket_id: str, description: str
    ) -> None:
        ActivityLogRepository.create(
            db,
            activity_type="ticket_updated",
            description=description,
            actor_id=actor_id,
            ticket_id=ticket_id,
        )

    @staticmethod
    def log_blacklist_added(
        db: Session, actor_id: str, description: str, ticket_id: str
    ) -> None:
        ActivityLogRepository.create(
            db,
            activity_type="blacklist_added",
            description=description,
            actor_id=actor_id,
            ticket_id=ticket_id,
        )

    @staticmethod
    def log_blacklist_removed(
        db: Session, actor_id: str, description: str
    ) -> None:
        ActivityLogRepository.create(
            db,
            activity_type="blacklist_removed",
            description=description,
            actor_id=actor_id,
        )

    @staticmethod
    def log_user_registered(
        db: Session, actor_id: str, description: str
    ) -> None:
        ActivityLogRepository.create(
            db,
            activity_type="user_registered",
            description=description,
            actor_id=actor_id,
        )
