"""blacklist/repository.py — Blacklist data access layer."""

from typing import Optional

from sqlalchemy.orm import Session

from app.models.blacklist import (
    BlacklistedURL,
    BlacklistedAccount,
    BlacklistedPhone,
    BlacklistedEmail,
)


class BlacklistRepository:
    """Database queries for all blacklist entity types."""

    # ── URL ────────────────────────────────────────────────────────────

    @staticmethod
    def get_all_urls(db: Session) -> list[BlacklistedURL]:
        return db.query(BlacklistedURL).filter(BlacklistedURL.is_active == True).all()

    @staticmethod
    def add_url(db: Session, url: str, domain: str, reason: str = "", ticket_id: str = "", added_by: str = "") -> BlacklistedURL:
        entry = BlacklistedURL(
            url=url, domain=domain, reason=reason or None,
            ticket_id=ticket_id or None, added_by=added_by or None,
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry

    @staticmethod
    def deactivate_url(db: Session, entry_id: int) -> bool:
        entry = db.query(BlacklistedURL).filter(BlacklistedURL.id == entry_id).first()
        if entry:
            entry.is_active = False
            db.commit()
            return True
        return False

    @staticmethod
    def check_url(db: Session, normalized_url: str, domain: str) -> Optional[BlacklistedURL]:
        entries = db.query(BlacklistedURL).filter(BlacklistedURL.is_active == True).all()
        for entry in entries:
            if (entry.domain and entry.domain == domain) or (
                entry.url and normalized_url and entry.url in normalized_url
            ):
                return entry
        return None

    # ── Account ────────────────────────────────────────────────────────

    @staticmethod
    def get_all_accounts(db: Session) -> list[BlacklistedAccount]:
        return db.query(BlacklistedAccount).filter(BlacklistedAccount.is_active == True).all()

    @staticmethod
    def add_account(db: Session, account_number: str, bank_name: str, reason: str = "", ticket_id: str = "", added_by: str = "") -> BlacklistedAccount:
        entry = BlacklistedAccount(
            account_number=account_number, bank_name=bank_name,
            reason=reason or None, ticket_id=ticket_id or None,
            added_by=added_by or None,
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry

    @staticmethod
    def deactivate_account(db: Session, entry_id: int) -> bool:
        entry = db.query(BlacklistedAccount).filter(BlacklistedAccount.id == entry_id).first()
        if entry:
            entry.is_active = False
            db.commit()
            return True
        return False

    @staticmethod
    def check_account(db: Session, clean_account: str) -> Optional[BlacklistedAccount]:
        return db.query(BlacklistedAccount).filter(
            BlacklistedAccount.account_number == clean_account,
            BlacklistedAccount.is_active == True,
        ).first()

    # ── Phone ──────────────────────────────────────────────────────────

    @staticmethod
    def get_all_phones(db: Session) -> list[BlacklistedPhone]:
        return db.query(BlacklistedPhone).filter(BlacklistedPhone.is_active == True).all()

    @staticmethod
    def add_phone(db: Session, phone_number: str, reason: str = "", ticket_id: str = "", added_by: str = "") -> BlacklistedPhone:
        entry = BlacklistedPhone(
            phone_number=phone_number, reason=reason or None,
            ticket_id=ticket_id or None, added_by=added_by or None,
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry

    @staticmethod
    def deactivate_phone(db: Session, entry_id: int) -> bool:
        entry = db.query(BlacklistedPhone).filter(BlacklistedPhone.id == entry_id).first()
        if entry:
            entry.is_active = False
            db.commit()
            return True
        return False

    @staticmethod
    def check_phone(db: Session, clean_phone: str) -> Optional[BlacklistedPhone]:
        return db.query(BlacklistedPhone).filter(
            BlacklistedPhone.phone_number == clean_phone,
            BlacklistedPhone.is_active == True,
        ).first()

    # ── Email ──────────────────────────────────────────────────────────

    @staticmethod
    def get_all_emails(db: Session) -> list[BlacklistedEmail]:
        return db.query(BlacklistedEmail).filter(BlacklistedEmail.is_active == True).all()

    @staticmethod
    def add_email(db: Session, email: str, reason: str = "", ticket_id: str = "", added_by: str = "") -> BlacklistedEmail:
        entry = BlacklistedEmail(
            email=email, reason=reason or None,
            ticket_id=ticket_id or None, added_by=added_by or None,
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry

    @staticmethod
    def deactivate_email(db: Session, entry_id: int) -> bool:
        entry = db.query(BlacklistedEmail).filter(BlacklistedEmail.id == entry_id).first()
        if entry:
            entry.is_active = False
            db.commit()
            return True
        return False

    @staticmethod
    def check_email(db: Session, clean_email: str) -> Optional[BlacklistedEmail]:
        return db.query(BlacklistedEmail).filter(
            BlacklistedEmail.email == clean_email,
            BlacklistedEmail.is_active == True,
        ).first()
