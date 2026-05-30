"""feedback.py — ML feedback model for collecting admin FP/TP labels."""

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text

from app.db.base import Base


class MLFeedback(Base):
    """Admin feedback on ticket correctness for ML retraining pipeline."""

    __tablename__ = "ml_feedback"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(String(50), ForeignKey("tickets.ticket_id", ondelete="CASCADE"), nullable=False, index=True)
    admin_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    feedback_type = Column(String(10), nullable=False)  # fp, tp, fn, tn
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
