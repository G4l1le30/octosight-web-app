"""gamification.py — Gamification API endpoints (v1)."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.modules.gamification.service import (
    get_user_gamification,
    get_leaderboard,
    get_total_points,
)

router = APIRouter(prefix="/gamification", tags=["gamification"])


@router.get("/me")
def my_gamification(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return gamification profile for the current user."""
    return get_user_gamification(db, current_user.id)


@router.get("/leaderboard")
def leaderboard(
    limit: int = 20,
    db: Session = Depends(get_db),
):
    """Return top users by points (public)."""
    return {"leaderboard": get_leaderboard(db, limit)}
