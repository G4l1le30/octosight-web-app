"""similarity.py — Ticket similarity via cosine distance on TF-IDF vectors."""

import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import require_admin
from app.db.session import get_db
from app.models.ticket import Ticket

router = APIRouter(prefix="/tickets", tags=["tickets"])


def _compute_similarity_scores(tickets: list[Ticket], target: Ticket) -> list[dict]:
    """Compute Jaccard-based similarity between target ticket and all others using flags."""
    target_flags = set()
    if target.flags:
        target_flags = {f.strip().lower() for f in target.flags.split(",") if f.strip()}
    target_text = f"{target.url or ''} {target.summary or ''} {target.type or ''}".lower()

    results = []
    for t in tickets:
        if t.id == target.id:
            continue
        t_flags = set()
        if t.flags:
            t_flags = {f.strip().lower() for f in t.flags.split(",") if f.strip()}
        t_text = f"{t.url or ''} {t.summary or ''} {t.type or ''}".lower()

        # Jaccard similarity on flags
        if target_flags or t_flags:
            intersection = len(target_flags & t_flags)
            union = len(target_flags | t_flags)
            flag_sim = intersection / union if union > 0 else 0
        else:
            flag_sim = 0

        # Type match bonus
        type_sim = 1.0 if t.type == target.type else 0

        # Combined score
        score = (flag_sim * 0.7) + (type_sim * 0.3)

        if score > 0:
            results.append({
                "ticket_id": t.ticket_id,
                "type": t.type,
                "risk_score": t.risk_score,
                "priority": t.priority,
                "status": t.status,
                "flags": t.flags,
                "similarity_score": round(score, 3),
            })

    results.sort(key=lambda x: -x["similarity_score"])
    return results[:5]


@router.get("/{ticket_id}/similar")
def get_similar_tickets(
    ticket_id: str,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Return top-5 most similar tickets by flag overlap and type match."""
    target = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Ticket not found")

    all_tickets = db.query(Ticket).filter(Ticket.id != target.id).all()
    similar = _compute_similarity_scores(all_tickets, target)

    return {
        "ticket_id": ticket_id,
        "similar_tickets": similar,
        "count": len(similar),
    }
