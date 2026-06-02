"""gamification/repository.py — Gamification data access layer."""

from datetime import date, datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.gamification import Achievement, UserAchievement, UserGamification


class GamificationRepository:

    @staticmethod
    def get_or_create_gamification(db: Session, user_id: str) -> UserGamification:
        g = db.query(UserGamification).filter(UserGamification.user_id == user_id).first()
        if not g:
            g = UserGamification(user_id=user_id)
            db.add(g)
            db.commit()
            db.refresh(g)
        return g

    @staticmethod
    def add_points(db: Session, user_id: str, points: int) -> UserGamification:
        g = GamificationRepository.get_or_create_gamification(db, user_id)
        g.total_points = (g.total_points or 0) + points
        g.level = max(1, (g.total_points // 100) + 1)
        g.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(g)
        return g

    @staticmethod
    def update_streak(db: Session, user_id: str) -> UserGamification:
        g = GamificationRepository.get_or_create_gamification(db, user_id)
        today = date.today()
        if g.last_activity_date == today:
            return g
        if g.last_activity_date and (today - g.last_activity_date).days == 1:
            g.current_streak = (g.current_streak or 0) + 1
        else:
            g.current_streak = 1
        g.longest_streak = max(g.longest_streak or 0, g.current_streak or 0)
        g.last_activity_date = today
        db.commit()
        db.refresh(g)
        return g

    @staticmethod
    def award_achievement(db: Session, user_id: str, achievement_id: str) -> Optional[UserAchievement]:
        existing = db.query(UserAchievement).filter(
            UserAchievement.user_id == user_id,
            UserAchievement.achievement_id == achievement_id,
        ).first()
        if existing:
            return None
        ua = UserAchievement(user_id=user_id, achievement_id=achievement_id)
        db.add(ua)
        db.commit()
        db.refresh(ua)
        return ua

    @staticmethod
    def get_earned_achievement_ids(db: Session, user_id: str) -> set[str]:
        rows = db.query(UserAchievement.achievement_id).filter(
            UserAchievement.user_id == user_id
        ).all()
        return {r[0] for r in rows}
        