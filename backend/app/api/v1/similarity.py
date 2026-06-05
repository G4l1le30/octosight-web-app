"""
similarity.py — Attack Similarity endpoints.

Endpoints:
  GET /api/v1/tickets/{ticket_id}/similar  — Find similar tickets
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.security import require_permission
from app.db.session import get_db
from app.modules.detection.similarity import find_similar

router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.get("/{ticket_id}/similar")
def get_similar_tickets(
    ticket_id: str,
    top_n: int = Query(5, ge=1, le=20),
    min_score: float = Query(0.1, ge=0.0, le=1.0),
    db: Session = Depends(get_db),
    _=Depends(require_permission("tickets.view")),
):
    results = find_similar(db, ticket_id, top_n=top_n, min_score=min_score)
    return {"ticket_id": ticket_id, "similar": results, "count": len(results)}
