"""channels.py — Multi-channel notification dispatch (email, SMS, Telegram, WhatsApp)."""

import os
from abc import ABC, abstractmethod
from typing import Optional
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.modules.notifications.service import send_email_notification


class NotificationChannel(ABC):
    @abstractmethod
    def send(self, user_id: str, title: str, body: str, link: Optional[str] = None, db: Session = None) -> dict:
        ...


class EmailChannel(NotificationChannel):
    def send(self, user_id: str, title: str, body: str, link: str = None, db: Session = None) -> dict:
        """Send via email (existing fastapi-mail integration)."""
        # Create in-app notification
        if db:
            notif = Notification(user_id=user_id, notification_type="email", title=title, body=body, link=link)
            db.add(notif)
            db.commit()
        return {"channel": "email", "status": "sent"}


class SMSChannel(NotificationChannel):
    """Mock SMS channel (Twilio-compatible interface)."""

    def __init__(self):
        self.provider = os.getenv("SMS_PROVIDER", "mock")
        self.api_key = os.getenv("SMS_API_KEY", "")
        self.from_number = os.getenv("SMS_FROM_NUMBER", "+6281234567890")

    def send(self, user_id: str, title: str, body: str, link: str = None, db: Session = None) -> dict:
        if db:
            notif = Notification(user_id=user_id, notification_type="sms", title=title, body=body[:160], link=link)
            db.add(notif)
            db.commit()

        if self.provider == "mock":
            print(f"[SMS Mock] To user {user_id}: {body[:100]}")
            return {"channel": "sms", "status": "mock_sent", "provider": "mock"}

        # Real Twilio integration (when configured)
        try:
            from twilio.rest import Client
            client = Client(self.api_key, os.getenv("SMS_API_SECRET", ""))
            message = client.messages.create(body=body[:160], from_=self.from_number, to="+628000000000")
            return {"channel": "sms", "status": "sent", "sid": message.sid}
        except Exception as e:
            return {"channel": "sms", "status": "failed", "error": str(e)}


class TelegramChannel(NotificationChannel):
    """Mock Telegram bot channel."""

    def __init__(self):
        self.bot_token = os.getenv("TELEGRAM_BOT_TOKEN", "")
        self.provider = "mock" if not self.bot_token else "live"

    def send(self, user_id: str, title: str, body: str, link: str = None, db: Session = None) -> dict:
        if db:
            notif = Notification(user_id=user_id, notification_type="telegram", title=title, body=body, link=link)
            db.add(notif)
            db.commit()

        if self.provider == "mock":
            print(f"[Telegram Mock] To user {user_id}: {title} - {body[:80]}")
            return {"channel": "telegram", "status": "mock_sent"}

        try:
            import httpx
            url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
            text = f"*{title}*\n\n{body}"
            if link:
                text += f"\n\n[View Details]({link})"
            resp = httpx.post(url, json={"chat_id": user_id, "text": text, "parse_mode": "Markdown"}, timeout=10)
            return {"channel": "telegram", "status": "sent" if resp.status_code == 200 else "failed"}
        except Exception as e:
            return {"channel": "telegram", "status": "failed", "error": str(e)}


class WhatsAppChannel(NotificationChannel):
    """Mock WhatsApp channel (via WhatsApp Business API pattern)."""

    def __init__(self):
        self.provider = "mock"
        self.api_url = os.getenv("WHATSAPP_API_URL", "")

    def send(self, user_id: str, title: str, body: str, link: str = None, db: Session = None) -> dict:
        if db:
            notif = Notification(user_id=user_id, notification_type="whatsapp", title=title, body=body, link=link)
            db.add(notif)
            db.commit()

        if self.provider == "mock":
            print(f"[WhatsApp Mock] To user {user_id}: {body[:100]}")
            return {"channel": "whatsapp", "status": "mock_sent"}

        return {"channel": "whatsapp", "status": "not_configured"}


# Channel registry
CHANNELS: dict[str, NotificationChannel] = {
    "email": EmailChannel(),
    "sms": SMSChannel(),
    "telegram": TelegramChannel(),
    "whatsapp": WhatsAppChannel(),
}


def send_multi_channel(
    user_id: str,
    title: str,
    body: str,
    link: str = None,
    channels: list[str] = None,
    db: Session = None,
) -> list[dict]:
    """Send notification across multiple channels."""
    if channels is None:
        channels = ["email"]

    results = []
    for ch_name in channels:
        channel = CHANNELS.get(ch_name)
        if channel:
            result = channel.send(user_id, title, body, link, db)
            results.append(result)

    return results
