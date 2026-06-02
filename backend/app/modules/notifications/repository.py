"""notifications/repository.py — In-app notification data access layer."""

from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy import desc, update

from app.models.notification import Notification


class NotificationRepository:
    """Database queries for the Notification model."""

    @staticmethod
    def get_unread_count(
        db: Session, user_id: str | None = None, all_users: bool = False
    ) -> int:
        query = db.query(Notification).filter(Notification.is_read == False)
        if not all_users and user_id is not None:
            query = query.filter(Notification.user_id == user_id)
        return query.count()

    @staticmethod
    def list_for_user(
        db: Session,
        user_id: str | None = None,
        page: int = 1,
        per_page: int = 20,
        all_users: bool = False,
    ) -> tuple[list[Notification], int]:
        query = db.query(Notification)
        if not all_users and user_id is not None:
            query = query.filter(Notification.user_id == user_id)
        query = query.order_by(desc(Notification.created_at))
        total = query.count()
        offset = (page - 1) * per_page
        items = query.offset(offset).limit(per_page).all()
        return items, total

    @staticmethod
    def create(
        db: Session,
        user_id: str,
        notification_type: str,
        title: str,
        body: Optional[str] = None,
        link: Optional[str] = None,
    ) -> Notification:
        notification = Notification(
            user_id=user_id,
            notification_type=notification_type,
            title=title,
            body=body,
            link=link,
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification

    @staticmethod
    def mark_read(
        db: Session,
        notification_id: str,
        user_id: str | None = None,
        allow_all: bool = False,
    ) -> bool:
        query = db.query(Notification).filter(Notification.id == notification_id)
        if not allow_all and user_id is not None:
            query = query.filter(Notification.user_id == user_id)
        result = query.update({"is_read": True}, synchronize_session="fetch")
        db.commit()
        return result > 0

    @staticmethod
    def mark_all_read(db: Session, user_id: str | None = None, allow_all: bool = False) -> int:
        query = db.query(Notification).filter(Notification.is_read == False)
        if not allow_all and user_id is not None:
            query = query.filter(Notification.user_id == user_id)
        count = query.update({"is_read": True}, synchronize_session="fetch")
        db.commit()
        return count

    @staticmethod
    def delete(
        db: Session,
        notification_id: str,
        user_id: str | None = None,
        allow_all: bool = False,
    ) -> bool:
        query = db.query(Notification).filter(Notification.id == notification_id)
        if not allow_all and user_id is not None:
            query = query.filter(Notification.user_id == user_id)
        result = query.delete(synchronize_session="fetch")
        db.commit()
        return result > 0
