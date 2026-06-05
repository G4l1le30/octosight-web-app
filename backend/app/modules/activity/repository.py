"""activity/repository.py — ActivityLog data access layer."""

from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.activity import ActivityLog


class ActivityLogRepository:
    """Database queries for the ActivityLog model."""

    @staticmethod
    def list(
        db: Session,
        page: int = 1,
        per_page: int = 50,
        activity_type: Optional[str] = None,
    ) -> tuple[list[ActivityLog], int]:
        query = db.query(ActivityLog)

        if activity_type:
            query = query.filter(ActivityLog.activity_type == activity_type)

        total = query.count()
        query = query.order_by(ActivityLog.created_at.desc())

        offset = (page - 1) * per_page
        items = query.offset(offset).limit(per_page).all()

        return items, total

    @staticmethod
    def create(
        db: Session,
        activity_type: str,
        description: str,
        actor_id: Optional[str] = None,
        ticket_id: Optional[str] = None,
        metadata_json: Optional[str] = None,
    ) -> ActivityLog:
        entry = ActivityLog(
            activity_type=activity_type,
            description=description,
            actor_id=actor_id,
            ticket_id=ticket_id,
            metadata_json=metadata_json,
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry
