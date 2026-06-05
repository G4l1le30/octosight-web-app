"""
similarity.py — Attack similarity scoring using TF-IDF + cosine similarity.

Computes similarity between a given ticket and all other tickets based on
combined text fields (summary, url, extracted_text, flags). Embeddings are
stored in the DB and results are cached in Redis (30min TTL).
"""

import json
import logging
from typing import Any, Optional

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session

from app.core.redis_client import RedisClient
from app.models.ticket import Ticket

logger = logging.getLogger("octosight.similarity")

_redis = RedisClient()
_SIMILARITY_CACHE_TTL = 1800  # 30 minutes


def _build_text(t: Ticket) -> str:
    parts = [
        t.summary or "",
        t.url or "",
        t.sender_numbers or "",
        t.extracted_text or "",
        t.flags or "",
    ]
    return " ".join(parts)


def _ensure_embeddings(db: Session) -> None:
    """Compute and store TF-IDF embeddings for tickets missing them."""
    unembedded = db.query(Ticket).filter(Ticket.embedding.is_(None)).all()
    if not unembedded:
        return

    texts = [_build_text(t) for t in unembedded]
    vectorizer = TfidfVectorizer(max_features=5000, stop_words="english")
    matrix = vectorizer.fit_transform(texts)

    for i, ticket in enumerate(unembedded):
        vec = matrix[i].toarray().flatten().tolist()
        ticket.embedding = json.dumps(vec)

    db.commit()
    logger.info("Stored embeddings for %d tickets", len(unembedded))


def _load_embeddings(db: Session, max_tickets: int = 1000) -> tuple[np.ndarray, list[str]]:
    """Load embeddings from DB into a numpy array."""
    tickets = db.query(Ticket).filter(Ticket.embedding.isnot(None)).limit(max_tickets).all()
    ticket_ids = [t.ticket_id for t in tickets]
    vectors = [np.array(json.loads(t.embedding)) for t in tickets]
    return np.array(vectors), ticket_ids


def invalidate_cache() -> None:
    """Call when a new ticket is created to force similarity cache clear."""
    _redis.delete("similarity_cache_version")


def find_similar(
    db: Session,
    ticket_id: str,
    top_n: int = 5,
    min_score: float = 0.1,
) -> list[dict]:
    """
    Find top-N most similar tickets to the given ticket_id using DB-stored embeddings.

    Results are cached in Redis (30min TTL). Embeddings are auto-computed for
    tickets missing them.

    Returns list of dicts: {ticket_id, similarity_score, summary, url, type, status, priority, risk_score}.
    """
    # Check Redis cache first
    cache_key = f"similarity:{ticket_id}:{top_n}:{min_score}"
    cached = _redis.get_json(cache_key)
    if cached is not None:
        return cached

    # Ensure all tickets have embeddings
    _ensure_embeddings(db)

    # Load target ticket
    target = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not target or not target.embedding:
        return []

    target_vec = np.array(json.loads(target.embedding)).reshape(1, -1)

    # Load all other embeddings
    matrix, ticket_ids = _load_embeddings(db)

    if matrix.size == 0:
        return []

    # Compute cosine similarity
    scores = cosine_similarity(target_vec, matrix).flatten()

    # Rank excluding self
    ranked = sorted(
        [(s, i) for i, s in enumerate(scores) if ticket_ids[i] != ticket_id and s >= min_score],
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

    # Cache in Redis for 30 minutes
    _redis.set_json(cache_key, results, _SIMILARITY_CACHE_TTL)

    return results
