"""
url_scanner.py — Proactive URL scanner for phishing ticket URLs.

Scans tickets with URLs created >24h ago; if the URL is still live,
re-runs the detection engine and auto-escalates the ticket.
"""

import re
from datetime import datetime, timedelta, timezone
from typing import Optional

import requests
from sqlalchemy.orm import Session

from app.core.ml_engine import analyze_spam
from app.core.engines import rule_engine
from app.models.ticket import Ticket
from app.modules.tickets.service import TicketService


def _is_url(text: str) -> bool:
    return bool(re.match(r"^https?://", text.strip().lower()))


def _check_url_live(url: str, timeout: int = 10) -> tuple[bool, Optional[int]]:
    """
    Check if a URL is still reachable.
    Returns (is_live, status_code).
    """
    try:
        resp = requests.head(url, timeout=timeout, allow_redirects=True, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        })
        return resp.status_code < 500, resp.status_code
    except requests.RequestException:
        return False, None


def _reanalyze(url: str) -> dict:
    """Re-run detection on a URL. Returns {risk_score, priority, label, explanation, rule_score, ml_score}."""
    rule_score = rule_engine.score(url)
    try:
        ml_result = analyze_spam(url)
    except Exception:
        ml_result = {"error": "ML engine unavailable"}
    ml_score = ml_result.get("confidence", 0) if ml_result.get("category") == "phishing" else 0
    ml_score = ml_score if not ml_result.get("error") else 0

    final_score = round(rule_score * 0.35 + ml_score * 0.65)
    if final_score >= 70:
        priority = "HIGH"
        label = "Phishing"
    elif final_score >= 40:
        priority = "MEDIUM"
        label = "Suspicious"
    else:
        priority = "LOW"
        label = "Safe"

    return {
        "risk_score": final_score,
        "priority": priority,
        "label": label,
        "rule_score": round(rule_score, 2),
        "ml_score": round(ml_score, 2),
    }


def scan_ticket(db: Session, ticket: Ticket) -> Optional[dict]:
    """
    Scan a single ticket's URL. Returns scan result dict if URL was live, None otherwise.
    If the URL is still live and risk is HIGH, auto-escalate status.
    """
    url = ticket.url or ticket.sender_numbers or ""
    if not _is_url(url):
        return None

    is_live, status_code = _check_url_live(url)
    if not is_live:
        return {"ticket_id": ticket.ticket_id, "url": url, "status_code": status_code, "live": False, "escalated": False}

    result = _reanalyze(url)
    result["ticket_id"] = ticket.ticket_id
    result["url"] = url
    result["status_code"] = status_code
    result["live"] = True
    result["escalated"] = False

    # Auto-escalate: if risk is now HIGH and ticket is still "In Review" or "Submitted"
    if result["priority"] == "HIGH" and ticket.status in ("Submitted", "In Review"):
        ticket.status = "Confirmed"
        ticket.risk_score = result["risk_score"]
        ticket.priority = "HIGH"
        ticket.updated_at = datetime.now(timezone.utc)
        result["escalated"] = True

    return result


def scan_all_due_tickets(db: Session, older_than_hours: int = 24) -> list[dict]:
    """
    Scan all tickets with URLs created more than `older_than_hours` ago
    and whose status is not Closed/Mitigated/False Positive.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(hours=older_than_hours)
    tickets = db.query(Ticket).filter(
        Ticket.created_at <= cutoff,
        Ticket.status.notin_(["Closed", "Mitigated", "False Positive"]),
    ).all()

    results = []
    for ticket in tickets:
        try:
            result = scan_ticket(db, ticket)
            if result:
                results.append(result)
        except Exception as e:
            results.append({"ticket_id": ticket.ticket_id, "error": str(e)})

    if results:
        db.commit()

    return results
