from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.models.education import EducationModule, EducationArticle, UserLearningProgress, UserArticleProgress, UserQuizAttempt

class EducationRepository:
    @staticmethod
    def get_all_modules(db: Session) -> List[EducationModule]:
        return db.query(EducationModule).order_by(EducationModule.order_index).all()

    @staticmethod
    def get_module_by_id(db: Session, module_id: str) -> Optional[EducationModule]:
        return db.query(EducationModule).filter(EducationModule.id == module_id).first()

    @staticmethod
    def get_user_progress(db: Session, user_id: str, module_id: str) -> Optional[UserLearningProgress]:
        return db.query(UserLearningProgress).filter(
            UserLearningProgress.user_id == user_id,
            UserLearningProgress.module_id == module_id
        ).first()

    @staticmethod
    def create_user_progress(db: Session, user_id: str, module_id: str, status: str) -> UserLearningProgress:
        progress = UserLearningProgress(
            user_id=user_id,
            module_id=module_id,
            status=status
        )
        db.add(progress)
        db.commit()
        db.refresh(progress)
        return progress

    @staticmethod
    def get_article_progress(db: Session, user_id: str, article_id: str) -> Optional[UserArticleProgress]:
        return db.query(UserArticleProgress).filter(
            UserArticleProgress.user_id == user_id,
            UserArticleProgress.article_id == article_id
        ).first()

    @staticmethod
    def mark_article_as_read(db: Session, user_id: str, article_id: str) -> UserArticleProgress:
        progress = UserArticleProgress(
            user_id=user_id,
            article_id=article_id
        )
        db.add(progress)
        db.commit()
        return progress

    @staticmethod
    def get_quiz_attempts(db: Session, user_id: str, module_id: str) -> List[UserQuizAttempt]:
        return db.query(UserQuizAttempt).filter(
            UserQuizAttempt.user_id == user_id,
            UserQuizAttempt.module_id == module_id
        ).order_by(UserQuizAttempt.created_at.asc()).all()

    @staticmethod
    def get_quiz_attempt_by_id(db: Session, attempt_id: int, user_id: str, module_id: str) -> Optional[UserQuizAttempt]:
        return db.query(UserQuizAttempt).filter(
            UserQuizAttempt.id == attempt_id,
            UserQuizAttempt.user_id == user_id,
            UserQuizAttempt.module_id == module_id
        ).first()

    @staticmethod
    def create_quiz_attempt(db: Session, user_id: str, module_id: str, score: float, passed: bool, attempt_number: int, details: str) -> UserQuizAttempt:
        new_attempt = UserQuizAttempt(
            user_id=user_id,
            module_id=module_id,
            score=score,
            passed=1 if passed else 0,
            attempt_number=attempt_number,
            details=details
        )
        db.add(new_attempt)
        db.flush()
        return new_attempt

    @staticmethod
    def get_module_by_order(db: Session, order_index: int) -> Optional[EducationModule]:
        return db.query(EducationModule).filter(EducationModule.order_index == order_index).first()

    @staticmethod
    def get_articles_by_module(db: Session, module_id: str) -> List[EducationArticle]:
        return db.query(EducationArticle).filter(EducationArticle.module_id == module_id).all()
