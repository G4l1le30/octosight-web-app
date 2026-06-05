"""schemas — Pydantic request/response schemas.

Re-exports all schemas from domain-specific files.
"""

from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    GoogleLoginRequest,
    UserResponse,
    TokenResponse,
)
from app.schemas.ticket import (
    TicketResponse,
    TicketUpdate,
    TicketAssign,
    BulkTicketUpdate,
    AuditLogResponse,
    TicketFeedbackCreate,
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
    QuizAttemptRead,
)
from app.schemas.blacklist import (
    BlacklistURLCreate,
    BlacklistAccountCreate,
    BlacklistPhoneCreate,
    BlacklistEmailCreate,
    BlacklistCheckRequest,
    BlacklistEntryResponse,
)
from app.schemas.dashboard import (
    DashboardSummary,
    TrendPoint,
    TimelineResponse,
)
