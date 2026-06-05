"""
blacklist.py — Endpoints for managing the internal URL blacklist.

Routes:
  POST  /api/v1/admin/blacklist              Add a URL to the blacklist (admin only)
  GET   /api/v1/admin/blacklist              List all blacklisted entries (admin only)
  DELETE /api/v1/admin/blacklist/{id}        Remove/deactivate an entry (admin only)
  GET   /api/v1/admin/blacklist/check        Check if a URL is blacklisted (admin only)
"""

from urllib.parse import urlparse
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_admin, limiter
from app.db.session import get_db
from app.models.models import BlacklistedURL, BlacklistedAccount, BlacklistedPhone, BlacklistedEmail
from app.modules.activity.service import ActivityService
from app.modules.notifications.service import NotificationService

router = APIRouter(prefix="/api/v1/admin/blacklist", tags=["blacklist"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class BlacklistAddRequest(BaseModel):
    url: str
    reason: Optional[str] = None
    ticket_id: Optional[str] = None


class BlacklistResponse(BaseModel):
    id: str
    url: str
    domain: str
    reason: Optional[str]
    ticket_id: Optional[str]
    added_by: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AccountBlacklistAddRequest(BaseModel):
    account_number: str
    bank_name: str
    reason: Optional[str] = None
    ticket_id: Optional[str] = None


class AccountBlacklistResponse(BaseModel):
    id: str
    account_number: str
    bank_name: str
    reason: Optional[str]
    ticket_id: Optional[str]
    added_by: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PhoneBlacklistAddRequest(BaseModel):
    phone_number: str
    reason: Optional[str] = None
    ticket_id: Optional[str] = None


class PhoneBlacklistResponse(BaseModel):
    id: str
    phone_number: str
    reason: Optional[str]
    ticket_id: Optional[str]
    added_by: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class EmailBlacklistAddRequest(BaseModel):
    email: str
    reason: Optional[str] = None
    ticket_id: Optional[str] = None


class EmailBlacklistResponse(BaseModel):
    id: str
    email: str
    reason: Optional[str]
    ticket_id: Optional[str]
    added_by: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Helpers ────────────────────────────────────────────────────────────────────

def normalize_url_for_match(url: str) -> str:
    """Normalize URL for comparison: lower, no protocol, no www, no trailing slash."""
    if not url:
        return ""
    u = url.lower().strip()
    u = u.replace("https://", "").replace("http://", "")
    if u.startswith("www."):
        u = u[4:]
    return u.rstrip("/")


def _extract_domain(url: str) -> str:
    """Extract clean domain (without www.) from a URL string."""
    parsed = urlparse(url)
    if not parsed.scheme and url:
        parsed = urlparse(f"http://{url}")
    
    # If it's just a domain without path, netloc will be the domain
    # If it has path but no scheme, it might end up in path
    domain = parsed.netloc.lower().replace("www.", "")
    if not domain and "/" not in url:
        domain = url.lower().replace("www.", "")
    
    return domain or url.split("/")[0].lower().replace("www.", "")


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("", response_model=BlacklistResponse, summary="Add URL to blacklist (admin only)")
@limiter.limit("10/minute")
def add_to_blacklist(
    request: Request,
    body: BlacklistAddRequest,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    """
    Add a URL/domain to the internal blacklist.
    Future reports with the same domain will automatically receive a high risk score.
    Admin only.
    """
    domain = _extract_domain(body.url)
    if not domain:
        raise HTTPException(status_code=400, detail="Invalid URL — could not extract domain.")

    # Check if already blacklisted and active using flexible matching
    normalized_input = normalize_url_for_match(body.url)
    all_active = db.query(BlacklistedURL).filter(BlacklistedURL.is_active == True).all()
    
    existing = None
    for entry in all_active:
        if normalize_url_for_match(entry.url) == normalized_input or entry.domain == domain:
            existing = entry
            break

    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"URL or domain '{domain}' is already on the blacklist (entry #{existing.id})."
        )

    entry = BlacklistedURL(
        url=body.url.strip(),
        domain=domain,
        reason=body.reason,
        ticket_id=body.ticket_id,
        added_by=admin.id,
        is_active=True,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    ActivityService.log_blacklist_added(
        db, admin.id,
        f"URL blacklisted: {domain} (ticket: {body.ticket_id or 'manual'})",
        body.ticket_id,
    )
    
    # Create in-app notification for blacklist addition
    NotificationService.create_notification(
        db=db,
        user_id=admin.id,
        notification_type="blacklist_added",
        title=f"Blacklist entry added: {domain}",
        body=f"URL/domain blacklisted: {body.url}",
        link=f"/admin/blacklist",
    )
    
    return entry


@router.get("", response_model=list[BlacklistResponse], summary="List all blacklisted entries (admin only)")
def list_blacklist(
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Return all blacklist entries ordered by creation date descending. Admin only."""
    return db.query(BlacklistedURL).order_by(BlacklistedURL.created_at.desc()).all()


@router.delete("/{entry_id}", summary="Remove URL from blacklist (admin only)")
def remove_from_blacklist(
    entry_id: str,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    """Deactivate a blacklist entry (soft delete). Admin only."""
    entry = db.query(BlacklistedURL).filter(BlacklistedURL.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Blacklist entry not found.")

    entry.is_active = False
    entry.updated_at = datetime.now(timezone.utc)
    db.commit()

    ActivityService.log_blacklist_removed(
        db, admin.id,
        f"URL removed from blacklist: {entry.domain}",
    )
    
    # Create in-app notification for blacklist removal
    NotificationService.create_notification(
        db=db,
        user_id=admin.id,
        notification_type="blacklist_removed",
        title=f"Blacklist entry removed: {entry.domain}",
        body=f"URL/domain removed from blacklist: {entry.url}",
        link=f"/admin/blacklist",
    )
    
    return {"message": f"Entry #{entry_id} ({entry.domain}) removed from blacklist."}


@router.get("/check", summary="Check if a URL is blacklisted")
def check_url(
    url: str,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Check whether a given URL's domain is currently on the blacklist."""
    domain = _extract_domain(url)
    normalized_input = normalize_url_for_match(url)
    
    all_active = db.query(BlacklistedURL).filter(BlacklistedURL.is_active == True).all()
    entry = None
    for e in all_active:
        normalized_entry = normalize_url_for_match(e.url)
        if (e.domain and e.domain == domain) or (normalized_entry and normalized_entry in normalized_input):
            entry = e
            break
    return {
        "url": url,
        "domain": domain,
        "is_blacklisted": entry is not None,
        "entry_id": entry.id if entry else None,
        "reason": entry.reason if entry else None,
    }


# ── Account Endpoints ─────────────────────────────────────────────────────────

@router.post("/accounts", response_model=AccountBlacklistResponse, summary="Add bank account to blacklist")
@limiter.limit("10/minute")
def add_account_to_blacklist(
    request: Request,
    body: AccountBlacklistAddRequest,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    clean_acc = body.account_number.strip().replace(" ", "").replace("-", "")
    existing = db.query(BlacklistedAccount).filter(
        BlacklistedAccount.account_number == clean_acc,
        BlacklistedAccount.is_active == True
    ).first()
    
    if existing:
        raise HTTPException(status_code=409, detail=f"Account '{clean_acc}' is already blacklisted.")

    entry = BlacklistedAccount(
        account_number=clean_acc,
        bank_name=body.bank_name,
        reason=body.reason,
        ticket_id=body.ticket_id,
        added_by=admin.id,
        is_active=True,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    ActivityService.log_blacklist_added(
        db, admin.id,
        f"Bank account blacklisted: {clean_acc} ({body.bank_name or 'N/A'})",
        body.ticket_id,
    )
    
    # Create in-app notification for blacklist addition
    NotificationService.create_notification(
        db=db,
        user_id=admin.id,
        notification_type="blacklist_added",
        title=f"Bank account blacklisted: {clean_acc}",
        body=f"Account {clean_acc} blacklisted for {body.bank_name or 'N/A'}",
        link=f"/admin/blacklist/accounts",
    )
    
    return entry


@router.get("/accounts/check", summary="Check if an account is blacklisted")
def check_account(
    account_number: str,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    clean_acc = account_number.strip().replace(" ", "").replace("-", "")
    entry = db.query(BlacklistedAccount).filter(
        BlacklistedAccount.account_number == clean_acc,
        BlacklistedAccount.is_active == True
    ).first()
    return {
        "account_number": account_number,
        "is_blacklisted": entry is not None,
        "entry_id": entry.id if entry else None,
        "reason": entry.reason if entry else None,
    }


@router.get("/accounts", response_model=list[AccountBlacklistResponse], summary="List blacklisted accounts")
def list_account_blacklist(db: Session = Depends(get_db), _admin=Depends(require_admin)):
    return db.query(BlacklistedAccount).order_by(BlacklistedAccount.created_at.desc()).all()


@router.delete("/accounts/{entry_id}", summary="Remove account from blacklist")
def remove_account_from_blacklist(entry_id: str, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    entry = db.query(BlacklistedAccount).filter(BlacklistedAccount.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    entry.is_active = False
    db.commit()

    ActivityService.log_blacklist_removed(
        db, _admin.id,
        f"Bank account removed from blacklist: {entry.account_number}",
    )
    
    # Create in-app notification for blacklist removal
    NotificationService.create_notification(
        db=db,
        user_id=_admin.id,
        notification_type="blacklist_removed",
        title=f"Bank account removed from blacklist: {entry.account_number}",
        body=f"Account {entry.account_number} removed from blacklist",
        link=f"/admin/blacklist/accounts",
    )
    
    return {"message": "Account removed from blacklist"}


# ── Phone Endpoints ───────────────────────────────────────────────────────────

@router.post("/phones", response_model=PhoneBlacklistResponse, summary="Add phone number to blacklist")
def add_phone_to_blacklist(
    body: PhoneBlacklistAddRequest,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    clean_phone = body.phone_number.strip().replace(" ", "").replace("-", "")
    existing = db.query(BlacklistedPhone).filter(
        BlacklistedPhone.phone_number == clean_phone,
        BlacklistedPhone.is_active == True
    ).first()
    
    if existing:
        raise HTTPException(status_code=409, detail=f"Phone '{clean_phone}' is already blacklisted.")

    entry = BlacklistedPhone(
        phone_number=clean_phone,
        reason=body.reason,
        ticket_id=body.ticket_id,
        added_by=admin.id,
        is_active=True,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    ActivityService.log_blacklist_added(
        db, admin.id,
        f"Phone blacklisted: {clean_phone}",
        body.ticket_id,
    )
    
    # Create in-app notification for blacklist addition
    NotificationService.create_notification(
        db=db,
        user_id=admin.id,
        notification_type="blacklist_added",
        title=f"Phone number blacklisted: {clean_phone}",
        body=f"Phone {clean_phone} blacklisted",
        link=f"/admin/blacklist/phones",
    )
    
    return entry


@router.get("/phones/check", summary="Check if a phone number is blacklisted")
def check_phone(
    phone_number: str,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    clean_phone = phone_number.strip().replace(" ", "").replace("-", "").replace("+", "")
    entry = db.query(BlacklistedPhone).filter(
        BlacklistedPhone.phone_number == clean_phone,
        BlacklistedPhone.is_active == True
    ).first()
    return {
        "phone_number": phone_number,
        "is_blacklisted": entry is not None,
        "entry_id": entry.id if entry else None,
        "reason": entry.reason if entry else None,
    }


@router.get("/phones", response_model=list[PhoneBlacklistResponse], summary="List blacklisted phones")
def list_phone_blacklist(db: Session = Depends(get_db), _admin=Depends(require_admin)):
    return db.query(BlacklistedPhone).order_by(BlacklistedPhone.created_at.desc()).all()


@router.delete("/phones/{entry_id}", summary="Remove phone from blacklist")
def remove_phone_from_blacklist(entry_id: str, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    entry = db.query(BlacklistedPhone).filter(BlacklistedPhone.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    entry.is_active = False
    db.commit()

    ActivityService.log_blacklist_removed(
        db, _admin.id,
        f"Phone removed from blacklist: {entry.phone_number}",
    )
    
    NotificationService.create_notification(
        db=db,
        user_id=_admin.id,
        notification_type="blacklist_removed",
        title=f"Phone number removed from blacklist: {entry.phone_number}",
        body=f"Phone {entry.phone_number} removed from blacklist",
        link=f"/admin/blacklist/phones",
    )
    
    return {"message": "Phone removed from blacklist"}


# ── Email Endpoints ───────────────────────────────────────────────────────────

@router.post("/emails", response_model=EmailBlacklistResponse, summary="Add email to blacklist")
def add_email_to_blacklist(
    body: EmailBlacklistAddRequest,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    clean_email = body.email.strip().lower()
    existing = db.query(BlacklistedEmail).filter(
        BlacklistedEmail.email == clean_email,
        BlacklistedEmail.is_active == True
    ).first()
    
    if existing:
        raise HTTPException(status_code=409, detail=f"Email '{clean_email}' is already blacklisted.")

    entry = BlacklistedEmail(
        email=clean_email,
        reason=body.reason,
        ticket_id=body.ticket_id,
        added_by=admin.id,
        is_active=True,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    ActivityService.log_blacklist_added(
        db, admin.id,
        f"Email blacklisted: {clean_email}",
        body.ticket_id,
    )
    
    NotificationService.create_notification(
        db=db,
        user_id=admin.id,
        notification_type="blacklist_added",
        title=f"Email blacklisted: {clean_email}",
        body=f"Email {clean_email} blacklisted",
        link=f"/admin/blacklist/emails",
    )
    
    return entry


@router.get("/emails/check", summary="Check if an email is blacklisted")
def check_email(
    email: str,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    clean_email = email.strip().lower()
    entry = db.query(BlacklistedEmail).filter(
        BlacklistedEmail.email == clean_email,
        BlacklistedEmail.is_active == True
    ).first()
    return {
        "email": email,
        "is_blacklisted": entry is not None,
        "entry_id": entry.id if entry else None,
        "reason": entry.reason if entry else None,
    }


@router.get("/emails", response_model=list[EmailBlacklistResponse], summary="List blacklisted emails")
def list_email_blacklist(db: Session = Depends(get_db), _admin=Depends(require_admin)):
    return db.query(BlacklistedEmail).order_by(BlacklistedEmail.created_at.desc()).all()


@router.delete("/emails/{entry_id}", summary="Remove email from blacklist")
def remove_email_from_blacklist(entry_id: str, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    entry = db.query(BlacklistedEmail).filter(BlacklistedEmail.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    entry.is_active = False
    db.commit()

    ActivityService.log_blacklist_removed(
        db, _admin.id,
        f"Email removed from blacklist: {entry.email}",
    )
    
    NotificationService.create_notification(
        db=db,
        user_id=_admin.id,
        notification_type="blacklist_removed",
        title=f"Email removed from blacklist: {entry.email}",
        body=f"Email {entry.email} removed from blacklist",
        link=f"/admin/blacklist/emails",
    )
    
    return {"message": "Email removed from blacklist"}
