"""blacklist/service.py — Blacklist business logic."""

from typing import Optional

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictException, NotFoundException
from app.modules.blacklist.repository import BlacklistRepository


_URL_SHORTENERS = {"bit.ly", "s.id", "tinyurl.com", "t.co", "goo.gl"}


def _extract_domain(url: str) -> str:
    """Extract domain from a URL. Returns empty string if not possible."""
    from urllib.parse import urlparse
    try:
        parsed = urlparse(url)
        domain = parsed.netloc or parsed.path.split("/")[0]
        return domain.replace("www.", "").lower().strip()
    except Exception:
        return ""


def _normalize_url(url: str) -> str:
    """Normalize a URL for comparison."""
    url = url.strip().lower()
    url = url.replace("https://", "").replace("http://", "")
    url = url.rstrip("/")
    url = url.replace("www.", "", 1)
    return url


class BlacklistService:
    """Business logic for blacklist operations."""

    @staticmethod
    def add_url(db: Session, url: str, reason: str = "", ticket_id: str = "", added_by: str = ""):
        domain = _extract_domain(url)
        normalized = _normalize_url(url)

        # Check for existing active entry
        existing = BlacklistRepository.check_url(db, normalized, domain)
        if existing:
            raise ConflictException("URL already blacklisted")

        entry = BlacklistRepository.add_url(db, url, domain, reason, ticket_id, added_by)
        return entry

    @staticmethod
    def add_account(db: Session, account_number: str, bank_name: str, reason: str = "", ticket_id: str = "", added_by: str = ""):
        clean = account_number.strip().replace(" ", "").replace("-", "")
        existing = BlacklistRepository.check_account(db, clean)
        if existing:
            raise ConflictException("Account already blacklisted")
        return BlacklistRepository.add_account(db, clean, bank_name, reason, ticket_id, added_by)

    @staticmethod
    def add_phone(db: Session, phone_number: str, reason: str = "", ticket_id: str = "", added_by: str = ""):
        clean = phone_number.strip().replace(" ", "").replace("-", "").replace("+", "")
        existing = BlacklistRepository.check_phone(db, clean)
        if existing:
            raise ConflictException("Phone already blacklisted")
        return BlacklistRepository.add_phone(db, clean, reason, ticket_id, added_by)

    @staticmethod
    def add_email(db: Session, email: str, reason: str = "", ticket_id: str = "", added_by: str = ""):
        clean = email.strip().lower()
        existing = BlacklistRepository.check_email(db, clean)
        if existing:
            raise ConflictException("Email already blacklisted")
        return BlacklistRepository.add_email(db, clean, reason, ticket_id, added_by)

    @staticmethod
    def remove(db: Session, entity_type: str, entry_id: int) -> None:
        methods = {
            "url": BlacklistRepository.deactivate_url,
            "account": BlacklistRepository.deactivate_account,
            "phone": BlacklistRepository.deactivate_phone,
            "email": BlacklistRepository.deactivate_email,
        }
        deactivate = methods.get(entity_type)
        if not deactivate:
            raise ValueError(f"Invalid entity type: {entity_type}")
        if not deactivate(db, entry_id):
            raise NotFoundException(f"{entity_type.capitalize()} blacklist entry not found")
