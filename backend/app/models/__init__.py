"""models — SQLAlchemy ORM models.

Re-exports all models from domain-specific files.
"""

from app.models.user import User
from app.models.ticket import Ticket, TicketAuditLog
from app.models.blacklist import BlacklistedURL, BlacklistedAccount, BlacklistedPhone, BlacklistedEmail
from app.models.education import EducationModule, EducationArticle, UserLearningProgress, UserArticleProgress, UserQuizAttempt
from app.models.mock_bank import MockBankTransaction
from app.models.feedback import MLFeedback
from app.models.rule_config import RuleConfig
from app.models.notification import Notification
from app.models.activity import ActivityLog
from app.models.pending_registration import PendingRegistration
from app.models.permission import Permission, RolePermission

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
    "RuleConfig",
    "Notification",
    "ActivityLog",
    "PendingRegistration",
    "Permission",
    "RolePermission",
]
