"""
schemas.py — Backward-compatible re-exports.

All schemas have migrated to app/schemas/<domain>.py.
This file remains for import compatibility during refactoring.
"""

from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    GoogleLoginRequest,
    UserResponse,
    DeleteAccountRequest,
)
from app.schemas.ticket import (
    TicketUpdate,
    AuditLogResponse,
)
from app.schemas.detection import (
    AnalysisRequest,
    MessageRequest,
    SpamPredictionResponse,
    HybridScoreResult,
)
from app.schemas.education import (
    EducationArticleRead,
    EducationModuleCreate,
    EducationModuleRead,
    EducationModuleWithProgress,
    UserLearningProgressCreate,
    UserLearningProgressUpdate,
    UserLearningProgressRead,
    QuizQuestion,
    QuizResponse,
    QuizSubmission,
    QuizResult,
    EducationRecommendation,
)
