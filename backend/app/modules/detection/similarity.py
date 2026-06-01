"""
similarity.py — Attack similarity scoring using TF-IDF + cosine similarity.

Computes similarity between a given ticket and all other tickets based on
combined text fields (summary, url, extracted_text, flags). Results are
cached in-memory and invalidated when new tickets are created.
"""

import hashlib
import time
from typing import Any, Optional

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session

from app.models.ticket import Ticket

# In-memory cache
_cache: dict[str, Any] = {"version": 0, "matrix": None, "tickets": [], "built_at": 0}
_cache_ttl = 3600  # 1 hour


def _build_text(t: Ticket) -> str:
    parts = [
        t.summary or "",
        t.url or "",
        t.sender_numbers or "",
        t.extracted_text or "",
        t.flags or "",
    ]
    return " ".join(parts)


def _rebuild_index(db: Session) -> None:
    """Build or rebuild the TF-IDF matrix from all tickets."""
    tickets = db.query(Ticket).order_by(Ticket.created_at.desc()).limit(500).all()
    texts = [_build_text(t) for t in tickets]
    ticket_ids = [t.ticket_id for t in tickets]

    if not texts:
        _cache["matrix"] = None
        _cache["tickets"] = []
        _cache["built_at"] = time.time()
        return

    vectorizer = TfidfVectorizer(max_features=5000, stop_words="english")
    matrix = vectorizer.fit_transform(texts)

    _cache["matrix"] = matrix
    _cache["tickets"] = ticket_ids
    _cache["built_at"] = time.time()


def _ensure_index(db: Session) -> None:
    age = time.time() - _cache.get("built_at", 0)
    if _cache["matrix"] is None or age > _cache_ttl:
        _rebuild_index(db)


def invalidate_cache() -> None:
    """Call when a new ticket is created to force index rebuild."""
    _cache["built_at"] = 0


def find_similar(
    db: Session,
    ticket_id: str,
    top_n: int = 5,
    min_score: float = 0.1,
) -> list[dict]:
    """
    Find top-N most similar tickets to the given ticket_id.

    Returns list of dicts: {ticket_id, similarity_score, summary, url, type, status, priority, risk_score}.
    """
    _ensure_index(db)

    if _cache["matrix"] is None or not _cache["tickets"]:
        return []

    if ticket_id not in _cache["tickets"]:
        # Query the ticket directly
        ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
        if not ticket:
            return []
        # Rebuild with the target included
        _rebuild_index(db)

    try:
        idx = _cache["tickets"].index(ticket_id)
    except ValueError:
        return []

    matrix = _cache["matrix"]
    ticket_ids = _cache["tickets"]

    vec = matrix[idx]
    scores = cosine_similarity(vec, matrix).flatten()

    # Sort by similarity, exclude self
    ranked = sorted(
        [(s, i) for i, s in enumerate(scores) if i != idx and s >= min_score],
        key=lambda x: x[0],
        reverse=True,
    )[:top_n]

    results = []
    for score, i in ranked:
        tid = ticket_ids[i]
        t = db.query(Ticket).filter(Ticket.ticket_id == tid).first()
        if t:
            results.append({
                "ticket_id": t.ticket_id,
                "similarity_score": round(float(score), 4),
                "summary": (t.summary or "")[:150],
                "url": t.url or "",
                "type": t.type or "",
                "status": t.status or "",
                "priority": t.priority or "",
                "risk_score": t.risk_score,
            })

    return results
