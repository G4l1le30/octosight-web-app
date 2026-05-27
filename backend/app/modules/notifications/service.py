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

import logging
import os
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


def _log_mail_startup(enabled: bool) -> None:
    """Log a sanitized summary of the effective SMTP configuration."""
    if enabled:
        logger.info(
            "[Email] Mail service initialized successfully. server=%s port=%s from=%s username=%s",
            _MAIL_SERVER,
            _MAIL_PORT,
            _MAIL_FROM or _MAIL_USERNAME,
            _MAIL_USERNAME,
        )
        print("[Email] Mail service initialized successfully.")
        return

    logger.warning(
        "[Email] Mail service disabled. Missing MAIL_USERNAME or MAIL_PASSWORD."
    )
    print("[Email] WARNING: Mail credentials not configured. Emails will be skipped.")

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
else:
    fast_mail = None

_log_mail_startup(_mail_enabled)


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
                print(f"[Email] Critical Error: Authentication failed. Please check MAIL_PASSWORD.")
            else:
                print(f"[Email] Failed to send email to {message.recipients}: {str(exc)}")
    except Exception as e:
        print(f"[Email] Unexpected error in background task: {str(e)}")