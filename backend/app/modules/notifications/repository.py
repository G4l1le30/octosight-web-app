"""notifications/repository.py — In-app notification data access layer."""

from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy import desc, update

from app.models.notification import Notification


class NotificationRepository:
    """Database queries for the Notification model."""

    @staticmethod
    def get_unread_count(db: Session, user_id: str) -> int:
        return (
            db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.is_read == False)
            .count()
        )

    @staticmethod
    def list_for_user(
        db: Session, user_id: str, page: int = 1, per_page: int = 20
    ) -> tuple[list[Notification], int]:
        query = (
            db.query(Notification)
            .filter(Notification.user_id == user_id)
            .order_by(desc(Notification.created_at))
        )
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
    def mark_read(db: Session, notification_id: str, user_id: str) -> bool:
        result = (
            db.query(Notification)
            .filter(Notification.id == notification_id, Notification.user_id == user_id)
            .update({"is_read": True}, synchronize_session="fetch")
        )
        db.commit()
        return result > 0

    @staticmethod
    def mark_all_read(db: Session, user_id: str) -> int:
        count = (
            db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.is_read == False)
            .update({"is_read": True}, synchronize_session="fetch")
        )
        db.commit()
        return count

    @staticmethod
    def delete(db: Session, notification_id: str, user_id: str) -> bool:
        result = (
            db.query(Notification)
            .filter(Notification.id == notification_id, Notification.user_id == user_id)
            .delete(synchronize_session="fetch")
        )
        db.commit()
        return result > 0
