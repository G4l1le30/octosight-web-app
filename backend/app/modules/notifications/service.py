"""
notifications/service.py — Email notification service for OctoSight.

Uses fastapi-mail with Gmail SMTP and Jinja2 HTML templates.
All emails are sent asynchronously via FastAPI BackgroundTasks
to avoid blocking API responses.

Usage:
    from app.modules.notifications.service import send_email_notification

    await send_email_notification(
        background_tasks=background_tasks,
        subject="Your Subject",
        email_to="user@example.com",
        template_name="welcome.html",
        template_body={"user_name": "John"}
    )
"""

import os
import logging
from pathlib import Path
from typing import Optional

from fastapi import BackgroundTasks
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType

logger = logging.getLogger(__name__)

# ── SMTP Configuration ────────────────────────────────────────────────────────

_MAIL_USERNAME = os.getenv("MAIL_USERNAME", "")
_MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")
_MAIL_FROM = os.getenv("MAIL_FROM", "")
_MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
_MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
_MAIL_FROM_NAME = os.getenv("MAIL_FROM_NAME", "OctoSight Security")

# Only create config if credentials are present
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
    print("[Email] Mail service initialized successfully.")
else:
    fast_mail = None
    print("[Email] WARNING: Mail credentials not configured. Emails will be skipped.")


# ── Public API ─────────────────────────────────────────────────────────────────

def send_email_notification(
    background_tasks: BackgroundTasks,
    subject: str,
    email_to: str,
    template_name: str,
    template_body: dict,
) -> bool:
    """
    Queue an HTML email for background delivery.

    Args:
        background_tasks: FastAPI BackgroundTasks instance from the route handler.
        subject: Email subject line.
        email_to: Recipient email address.
        template_name: Jinja2 template filename (e.g. 'welcome.html').
        template_body: Dict of variables to render inside the template.

    Returns:
        True if the email was queued, False if mail is disabled.
    """
    if not _mail_enabled or fast_mail is None:
        logger.warning(
            "Email skipped (mail not configured): subject=%s, to=%s",
            subject, email_to,
        )
        return False

    message = MessageSchema(
        subject=subject,
        recipients=[email_to],
        template_body=template_body,
        subtype=MessageType.html,
    )

    background_tasks.add_task(_send_with_logging, message, template_name)
    logger.info("Email queued: subject=%s, to=%s", subject, email_to)
    return True


async def _send_with_logging(message: MessageSchema, template_name: str):
    """Internal wrapper that catches and logs send errors."""
    global fast_mail, _mail_enabled
    try:
        try:
            await fast_mail.send_message(message, template_name=template_name)
            print(f"[Email] Sent successfully: {message.subject} -> {message.recipients}")
        except Exception as exc:
            # If authentication fails, disable mail sending for future attempts
            if isinstance(exc, Exception) and 'SMTPAuthenticationError' in str(exc):
                fast_mail = None
                _mail_enabled = False
                logger.error("[Email] Authentication failed. Disabling email service.")
            else:
                logger.error(f"[Email] ERROR sending '{message.subject}' to {message.recipients}: {exc}")
            print(f"[Email] ERROR sending '{message.subject}' to {message.recipients}: {exc}")
    except Exception as exc:
        print(f"[Email] ERROR sending '{message.subject}' to {message.recipients}: {exc}")
        logger.error("Failed to send email: %s", exc, exc_info=True)
