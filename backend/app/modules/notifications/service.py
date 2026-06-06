"""
notifications/service.py — In-app notification + email notification services.

Combines:
- NotificationService: in-app notification CRUD (stored in DB, fetched via API)
- send_email_notification / send_email_async: async email via fastapi-mail + Jinja2
"""

import logging
import os
from pathlib import Path
from typing import Optional

from fastapi import BackgroundTasks
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.modules.notifications.repository import NotificationRepository

logger = logging.getLogger(__name__)

# ── SMTP Configuration ────────────────────────────────────────────────────────

_MAIL_USERNAME = os.getenv("MAIL_USERNAME", "")
_MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")
_MAIL_FROM = os.getenv("MAIL_FROM", "")
_MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
_MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
_MAIL_FROM_NAME = os.getenv("MAIL_FROM_NAME", "OctoSight Security")

_mail_enabled = bool(_MAIL_USERNAME and _MAIL_PASSWORD)

if _mail_enabled:
    conf = ConnectionConfig(
        MAIL_USERNAME=_MAIL_USERNAME,
        MAIL_PASSWORD=_MAIL_PASSWORD,
        MAIL_FROM=_MAIL_FROM or _MAIL_USERNAME,
        MAIL_PORT=_MAIL_PORT,
        MAIL_SERVER=_MAIL_SERVER,
        MAIL_FROM_NAME=_MAIL_FROM_NAME,
        MAIL_STARTTLS=True,
        MAIL_SSL_TLS=False,
        USE_CREDENTIALS=True,
        VALIDATE_CERTS=True,
        TEMPLATE_FOLDER=Path(__file__).parent / "templates",
    )
    fast_mail = FastMail(conf)
    logger.info("[Email] Mail service initialized (server=%s).", _MAIL_SERVER)
else:
    fast_mail = None
    logger.warning("[Email] Mail disabled — MAIL_USERNAME/PASSWORD not set.")


async def _send_with_logging(message: MessageSchema, template_name: str):
    """Internal wrapper that catches and logs send errors."""
    global fast_mail, _mail_enabled
    try:
        await fast_mail.send_message(message, template_name=template_name)
        logger.info("[Email] Sent: %s -> %s", message.subject, message.recipients)
        print(f"[Email] Sent: {message.subject} -> {message.recipients}")
    except Exception as exc:
        err = str(exc)
        if "SMTPAuthenticationError" in err:
            logger.critical("[Email] Authentication failed — check MAIL_PASSWORD.")
            print(f"[Email] CRITICAL: Authentication failed: {err}")
        elif "Connection refused" in err or "ConnectionError" in err or "timeout" in err.lower():
            logger.error("[Email] Connection failed: %s", exc)
            print(f"[Email] Connection failed: {err}")
        else:
            logger.error("[Email] Send failed: %s", exc)
            print(f"[Email] Send failed: {err}")


# ── Email Notification API (from old module, preserved for backward compat) ──

def send_email_notification(
    background_tasks: BackgroundTasks,
    subject: str,
    email_to: str,
    template_name: str,
    template_body: dict,
) -> bool:
    """Queue an HTML email for background delivery."""
    if not _mail_enabled or fast_mail is None:
        logger.warning("Email skipped (mail disabled): subject=%s, to=%s", subject, email_to)
        return False
    message = MessageSchema(
        subject=subject,
        recipients=[email_to],
        template_body=template_body,
        subtype=MessageType.html,
    )
    background_tasks.add_task(_send_with_logging, message, template_name)
    return True


async def send_email_async(
    subject: str,
    email_to: str,
    template_name: str,
    template_body: dict,
) -> bool:
    """Send an email asynchronously without BackgroundTasks."""
    if not _mail_enabled or fast_mail is None:
        logger.warning("Email async skipped (mail disabled): subject=%s, to=%s", subject, email_to)
        return False
    message = MessageSchema(
        subject=subject,
        recipients=[email_to],
        template_body=template_body,
        subtype=MessageType.html,
    )
    await _send_with_logging(message, template_name)
    return True


# ── In-App Notification Service (new) ────────────────────────────────────────

class NotificationService:
    """Business logic for in-app notifications (stored in DB, fetched via API)."""

    @staticmethod
    def get_unread_count(
        db: Session,
        user_id: str,
        include_all: bool = False,
        allowed_user_ids: Optional[list[str]] = None,
    ) -> int:
        return NotificationRepository.get_unread_count(db, user_id, all_users=include_all, allowed_user_ids=allowed_user_ids)

    @staticmethod
    def list_notifications(
        db: Session,
        user_id: str,
        page: int = 1,
        per_page: int = 20,
        include_all: bool = False,
        allowed_user_ids: Optional[list[str]] = None,
    ) -> tuple[list[Notification], int]:
        return NotificationRepository.list_for_user(
            db, user_id, page, per_page, all_users=include_all, allowed_user_ids=allowed_user_ids
        )

    @staticmethod
    def create_notification(
        db: Session,
        user_id: str,
        notification_type: str,
        title: str,
        body: Optional[str] = None,
        link: Optional[str] = None,
    ) -> Notification:
        return NotificationRepository.create(
            db, user_id, notification_type, title, body, link
        )

    @staticmethod
    def mark_read(
        db: Session,
        notification_id: str,
        user_id: str,
        allow_all: bool = False,
    ) -> bool:
        return NotificationRepository.mark_read(
            db, notification_id, user_id, allow_all=allow_all
        )

    @staticmethod
    def mark_all_read(
        db: Session,
        user_id: str,
        allow_all: bool = False,
    ) -> int:
        return NotificationRepository.mark_all_read(
            db, user_id, allow_all=allow_all
        )

    @staticmethod
    def delete(
        db: Session,
        notification_id: str,
        user_id: str,
        allow_all: bool = False,
    ) -> bool:
        return NotificationRepository.delete(
            db, notification_id, user_id, allow_all=allow_all
        )
