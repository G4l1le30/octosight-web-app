"""gamification.py — Gamification API endpoints: stats and achievements."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.modules.gamification.service import GamificationService

router = APIRouter(prefix="/gamification", tags=["gamification"])


@router.get("/my-stats")
def get_my_gamification_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current user's points, streak, level, and earned achievements."""
    return GamificationService.get_my_stats(db, current_user.id)


@router.get("/achievements")
def list_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all achievements with user's earned status."""
    return GamificationService.get_achievements(db, current_user.id)