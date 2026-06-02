"""gamification/service.py — Gamification business logic."""

from typing import Any

from sqlalchemy.orm import Session

from app.models.gamification import Achievement, UserAchievement
from app.modules.gamification.repository import GamificationRepository


# Achievement definitions for checking criteria
ACHIEVEMENT_DEFS: dict[str, dict] = {
    "first_report": {"name": "First Report", "description": "Submit your first ticket", "criteria_type": "count", "criteria_value": 1, "points": 50},
    "reporter_5": {"name": "Reporter x5", "description": "Submit 5 tickets", "criteria_type": "count", "criteria_value": 5, "points": 100},
    "reporter_10": {"name": "Reporter x10", "description": "Submit 10 tickets", "criteria_type": "count", "criteria_value": 10, "points": 200},
    "feedback_master": {"name": "Feedback Master", "description": "Submit 10 feedbacks", "criteria_type": "count", "criteria_value": 10, "points": 150},
    "accurate_eye": {"name": "Accurate Eye", "description": "5 correct TP/FP labels", "criteria_type": "count", "criteria_value": 5, "points": 150},
    "streak_3": {"name": "Streak 3", "description": "3-day login streak", "criteria_type": "streak", "criteria_value": 3, "points": 30},
    "streak_7": {"name": "Streak 7", "description": "7-day login streak", "criteria_type": "streak", "criteria_value": 7, "points": 100},
    "scholar": {"name": "Scholar", "description": "Complete all education modules", "criteria_type": "module", "criteria_value": 0, "points": 200},
    "phishing_hunter": {"name": "Phishing Hunter", "description": "5 confirmed tickets", "criteria_type": "count", "criteria_value": 5, "points": 250},
    "guardian": {"name": "Guardian", "description": "20 total confirmed tickets", "criteria_type": "count", "criteria_value": 20, "points": 500},
}


class GamificationService:

    @staticmethod
    def get_my_stats(db: Session, user_id: str) -> dict[str, Any]:
        g = GamificationRepository.get_or_create_gamification(db, user_id)
        earned_ids = GamificationRepository.get_earned_achievement_ids(db, user_id)
        achievements = db.query(Achievement).all()
        earned_list = [a for a in achievements if a.id in earned_ids]

        earned_at_map = {
            ua.achievement_id: ua.earned_at
            for ua in db.query(UserAchievement).filter(UserAchievement.user_id == user_id).all()
        }

        return {
            "total_points": g.total_points,
            "current_streak": g.current_streak,
            "longest_streak": g.longest_streak,
            "level": g.level,
            "achievements_earned": [{
                "code": a.code,
                "name": a.name,
                "description": a.description,
                "points": a.points,
                "earned_at": earned_at_map.get(a.id),
            } for a in earned_list],
        }

    @staticmethod
    def get_achievements(db: Session, user_id: str) -> list[dict[str, Any]]:
        earned_ids = GamificationRepository.get_earned_achievement_ids(db, user_id)
        achievements = db.query(Achievement).order_by(Achievement.code).all()
        return [{
            "code": a.code,
            "name": a.name,
            "description": a.description,
            "points": a.points,
            "icon_url": a.icon_url,
            "earned": a.id in earned_ids,
        } for a in achievements]

    @staticmethod
    def add_points_and_check_achievements(
        db: Session, user_id: str, points: int, event_type: str
    ) -> dict[str, Any]:
        g = GamificationRepository.add_points(db, user_id, points)
        earned_ids = GamificationRepository.get_earned_achievement_ids(db, user_id)
        new_achievements = []

        achievements = db.query(Achievement).all()
        for ach in achievements:
            if ach.id in earned_ids:
                continue
            # Simple criteria checking logic
            if ach.criteria_type == "streak":
                if (g.current_streak or 0) >= (ach.criteria_value or 0):
                    ua = GamificationRepository.award_achievement(db, user_id, ach.id)
                    if ua:
                        g = GamificationRepository.add_points(db, user_id, ach.points)
                        new_achievements.append(ach.code)
            elif ach.criteria_type == "count":
                if event_type == "report":
                    from app.models.ticket import Ticket
                    count = db.query(Ticket).filter(Ticket.user_id == user_id).count()
                elif event_type == "feedback":
                    from app.models.feedback import MLFeedback
                    count = db.query(MLFeedback).filter(MLFeedback.admin_id == user_id).count()
                else:
                    count = 0
                if count >= (ach.criteria_value or 0):
                    ua = GamificationRepository.award_achievement(db, user_id, ach.id)
                    if ua:
                        g = GamificationRepository.add_points(db, user_id, ach.points)
                        new_achievements.append(ach.code)

        return {
            "total_points": g.total_points,
            "level": g.level,
            "new_achievements": new_achievements,
        }