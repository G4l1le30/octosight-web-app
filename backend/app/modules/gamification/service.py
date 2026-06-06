"""gamification/service.py — Gamification business logic."""

from typing import Any

from sqlalchemy.orm import Session

from app.models.gamification import Achievement, UserAchievement
from app.modules.gamification.repository import GamificationRepository


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
        from app.models.ticket import Ticket
        from app.models.feedback import MLFeedback
        from app.models.education import UserLearningProgress, UserArticleProgress, UserQuizAttempt, EducationModule
        from app.models.gamification import Achievement as AchModel

        g = GamificationRepository.add_points(db, user_id, points)
        earned_ids = GamificationRepository.get_earned_achievement_ids(db, user_id)
        new_achievements = []

        total_modules = db.query(EducationModule).count()

        achievements = db.query(AchModel).all()
        for ach in achievements:
            if ach.id in earned_ids:
                continue

            awarded = False

            if ach.criteria_type == "streak":
                if (g.current_streak or 0) >= (ach.criteria_value or 0):
                    awarded = True

            elif ach.criteria_type == "module":
                completed = db.query(UserLearningProgress).filter(
                    UserLearningProgress.user_id == user_id,
                    UserLearningProgress.status == "COMPLETED",
                ).count()
                if ach.code == "first_module" and completed >= 1:
                    awarded = True
                elif ach.code == "half_modules" and completed >= 4:
                    awarded = True
                elif ach.code == "scholar" and completed >= total_modules and total_modules > 0:
                    awarded = True

            elif ach.criteria_type == "quiz":
                perfect = db.query(UserQuizAttempt).filter(
                    UserQuizAttempt.user_id == user_id,
                    UserQuizAttempt.score == 100,
                ).count()
                if perfect >= 1:
                    awarded = True

            elif ach.criteria_type == "count":
                if ach.code in ("first_report", "reporter_5", "reporter_10"):
                    count = db.query(Ticket).filter(Ticket.user_id == user_id).count()
                elif ach.code in ("phishing_hunter", "guardian"):
                    count = db.query(Ticket).filter(
                        Ticket.user_id == user_id,
                        Ticket.status == "Confirmed",
                    ).count()
                elif ach.code == "feedback_master":
                    count = db.query(MLFeedback).filter(MLFeedback.admin_id == user_id).count()
                elif ach.code == "accurate_eye":
                    count = db.query(MLFeedback).filter(
                        MLFeedback.admin_id == user_id,
                        MLFeedback.feedback_type.in_(["tp", "fp"]),
                    ).count()
                elif ach.code == "bookworm":
                    count = db.query(UserArticleProgress).filter(
                        UserArticleProgress.user_id == user_id,
                    ).count()
                else:
                    count = 0

                if count >= (ach.criteria_value or 0):
                    awarded = True

            if awarded:
                ua = GamificationRepository.award_achievement(db, user_id, ach.id)
                if ua:
                    g = GamificationRepository.add_points(db, user_id, ach.points)
                    new_achievements.append(ach.code)

        return {
            "total_points": g.total_points,
            "level": g.level,
            "new_achievements": new_achievements,
        }