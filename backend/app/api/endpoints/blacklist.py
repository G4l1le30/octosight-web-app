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

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_admin
from app.db.session import get_db
from app.models.models import BlacklistedURL

router = APIRouter(prefix="/api/v1/admin/blacklist", tags=["blacklist"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class BlacklistAddRequest(BaseModel):
    url: str
    reason: Optional[str] = None
    ticket_id: Optional[str] = None


class BlacklistResponse(BaseModel):
    id: int
    url: str
    domain: str
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
def add_to_blacklist(
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

    print(f"[Blacklist] Domain '{domain}' added by admin {admin.email} (ticket: {body.ticket_id})")
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
    entry_id: int,
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

    print(f"[Blacklist] Entry #{entry_id} ({entry.domain}) deactivated by admin {admin.email}")
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
