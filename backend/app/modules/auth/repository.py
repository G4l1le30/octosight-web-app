"""auth/repository.py — User data access layer."""

from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:
    """Database queries for the User model."""

    @staticmethod
    def get_by_id(db: Session, user_id: str) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def email_exists(db: Session, email: str) -> bool:
        return db.query(User).filter(User.email == email).first() is not None

    @staticmethod
    def create(
        db: Session,
        user_id: str,
        full_name: str,
        email: str,
        hashed_password: str,
        role: str = "user",
    ) -> User:
        user = User(
            id=user_id,
            full_name=full_name,
            email=email,
            hashed_password=hashed_password,
            role=role,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def increment_failed_logins(db: Session, user: User) -> None:
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= 5:
            user.locked_until = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=15)
        db.commit()

    @staticmethod
    def reset_lockout(db: Session, user: User) -> None:
        user.failed_login_attempts = 0
        user.locked_until = None
        db.commit()

    @staticmethod
    def is_locked(user: User) -> bool:
        if user.locked_until:
            return user.locked_until > datetime.now(timezone.utc).replace(tzinfo=None)
        return False
