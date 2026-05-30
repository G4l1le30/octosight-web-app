"""
models.py — Backward-compatible re-exports.

All models have migrated to app/models/<domain>.py.
This file remains for import compatibility during refactoring.
"""

from app.models.user import User
from app.models.ticket import Ticket, TicketAuditLog
from app.models.blacklist import BlacklistedURL, BlacklistedAccount, BlacklistedPhone, BlacklistedEmail
from app.models.education import EducationModule, EducationArticle, UserLearningProgress, UserArticleProgress, UserQuizAttempt
from app.models.mock_bank import MockBankTransaction
from app.models.feedback import MLFeedback

__all__ = [
    "User",
    "Ticket",
    "TicketAuditLog",
    "BlacklistedURL",
    "BlacklistedAccount",
    "BlacklistedPhone",
    "BlacklistedEmail",
    "EducationModule",
    "EducationArticle",
    "UserLearningProgress",
    "UserArticleProgress",
    "UserQuizAttempt",
    "MockBankTransaction",
    "MLFeedback",
]
