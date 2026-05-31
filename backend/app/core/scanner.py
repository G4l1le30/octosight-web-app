"""scanner.py — Background URL scanner that re-checks ticket URLs after 24h."""

import asyncio
import time
from datetime import datetime, timezone, timedelta
from typing import Optional

import httpx
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.ticket import Ticket

# In-memory state
_scan_task: Optional[asyncio.Task] = None
_running = False


def _check_url(url: str, timeout: int = 10) -> dict:
    """Check if a URL is still live. Returns status info."""
    try:
        with httpx.Client(timeout=timeout, follow_redirects=True) as client:
            response = client.head(url, allow_redirects=True)
            return {
                "status_code": response.status_code,
                "is_live": response.status_code < 400,
                "final_url": str(response.url),
            }
    except Exception as e:
        return {"status_code": 0, "is_live": False, "error": str(e)}


def _scan_once():
    """Run one scan cycle: find tickets older than 24h with URLs, re-check them."""
    db = SessionLocal()
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
        tickets = (
            db.query(Ticket)
            .filter(Ticket.url.isnot(None), Ticket.url != "")
            .filter(Ticket.created_at < cutoff)
            .filter(Ticket.status.in_(["Submitted", "In Review"]))
            .limit(20)
            .all()
        )

        results = []
        for t in tickets:
            url_result = _check_url(t.url)
            if url_result.get("is_live") and t.risk_score and t.risk_score < 90:
                # URL still live — auto-escalate risk score
                old_score = t.risk_score
                t.risk_score = min(100, t.risk_score + 10)
                flags = t.flags or ""
                if "url_still_active" not in flags:
                    t.flags = f"{flags},url_still_active".strip(",").strip()
                results.append({
                    "ticket_id": t.ticket_id,
                    "url": t.url,
                    "old_score": old_score,
                    "new_score": t.risk_score,
                    "action": "auto_escalated",
                })

        if results:
            db.commit()
        return results
    except Exception as e:
        db.rollback()
        return [{"error": str(e)}]
    finally:
        db.close()


async def _scanner_loop():
    """Background loop that runs a scan every 30 minutes."""
    global _running
    _running = True
    # Wait 5 minutes after startup before first scan
    await asyncio.sleep(300)
    while _running:
        try:
            loop = asyncio.get_event_loop()
            results = await loop.run_in_executor(None, _scan_once)
            if results and not any("error" in r for r in results):
                print(f"[Scanner] Scan complete: {len(results)} tickets checked, {sum(1 for r in results if r.get('action') == 'auto_escalated')} escalated")
        except Exception as e:
            print(f"[Scanner] Error: {e}")
        await asyncio.sleep(1800)  # 30 minutes


def start_scanner():
    """Start the background URL scanner task."""
    global _scan_task
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            _scan_task = loop.create_task(_scanner_loop())
            print("[Scanner] Background URL scanner started")
    except Exception as e:
        print(f"[Scanner] Could not start scanner: {e}")


def stop_scanner():
    """Stop the background scanner."""
    global _running, _scan_task
    _running = False
    if _scan_task:
        _scan_task.cancel()
        _scan_task = None
