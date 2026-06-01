"""
activity.py — Activity log model for the unified activity feed.

Records key system events: ticket creation, status changes,
blacklist additions, report submissions.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text

from app.db.base import Base


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    activity_type = Column(String(50), nullable=False, index=True)
    # One of: ticket_created, ticket_updated, blacklist_added, blacklist_removed, user_registered, report_submitted
    description = Column(String(500), nullable=False)
    actor_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    ticket_id = Column(String(50), nullable=True, index=True)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
