"""notifications.py — In-app notification API endpoints (v1)."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.modules.notifications.service import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
def list_notifications(
    page: int = 1,
    per_page: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, total = NotificationService.list_notifications(
        db, current_user.id, page, per_page
    )
    unread_count = NotificationService.get_unread_count(db, current_user.id)
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "unread_count": unread_count,
    }


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = NotificationService.get_unread_count(db, current_user.id)
    return {"unread_count": count}


@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ok = NotificationService.mark_read(db, notification_id, current_user.id)
    return {"status": "read" if ok else "not_found"}


@router.patch("/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = NotificationService.mark_all_read(db, current_user.id)
    return {"status": "all_read", "marked_count": count}


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ok = NotificationService.delete(db, notification_id, current_user.id)
    return {"status": "deleted" if ok else "not_found"}
