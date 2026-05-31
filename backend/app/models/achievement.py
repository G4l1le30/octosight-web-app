"""achievement.py — Gamification: badges, points, streaks for education."""

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Boolean
from sqlalchemy.orm import relationship

from app.db.base import Base


class Achievement(Base):
    """Achievement badge definitions."""
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(255), nullable=False)
    icon = Column(String(50), nullable=False, default="award")
    category = Column(String(50), nullable=False, default="education")
    points = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class UserAchievement(Base):
    """Earned achievements per user."""
    __tablename__ = "user_achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    achievement_id = Column(Integer, ForeignKey("achievements.id", ondelete="CASCADE"), nullable=False)
    earned_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class UserPoints(Base):
    """Points ledger per user."""
    __tablename__ = "user_points"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    points = Column(Integer, nullable=False)
    source = Column(String(100), nullable=False)  # e.g. "quiz_completed", "report_submitted"
    reference_id = Column(String(100), nullable=True)  # module_id, ticket_id, etc.
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class UserStreak(Base):
    """Daily login/education streak tracking."""
    __tablename__ = "user_streaks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_active_date = Column(String(10), nullable=True)  # YYYY-MM-DD
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
