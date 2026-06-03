"""education.py — Pydantic schemas for education modules, quizzes, and progress."""

from typing import Any, Optional
from datetime import datetime

from pydantic import BaseModel


class EducationArticleRead(BaseModel):
    id: str
    title: str
    url: str
    author: str
    duration_mins: int
    publication_date: Optional[datetime] = None
    description: Optional[str] = None
    is_read: bool = False

    class Config:
        from_attributes = True


class EducationModuleRead(BaseModel):
    id: str
    title: str
    level: str
    order_index: int
    description: str
    duration_mins: int
    articles: list[EducationArticleRead] = []

    class Config:
        from_attributes = True


class EducationModuleCreate(BaseModel):
    title: str
    level: str
    order_index: int
    description: str
    duration_mins: int


class QuizAttemptRead(BaseModel):
    id: str
    score: float
    passed: bool
    attempt_number: int
    created_at: datetime
    details: Optional[str] = None

    class Config:
        from_attributes = True


class EducationModuleWithProgress(EducationModuleRead):
    status: Optional[str] = None
    quiz_score: Optional[float] = None
    completed_at: Optional[datetime] = None
    quiz_attempts_history: list[QuizAttemptRead] = []


class UserLearningProgressCreate(BaseModel):
    user_id: str
    module_id: str


class UserLearningProgressUpdate(BaseModel):
    status: Optional[str] = None
    quiz_score: Optional[float] = None


class UserLearningProgressRead(BaseModel):
    id: str
    user_id: str
    module_id: str
    status: str
    quiz_score: Optional[float] = None
    quiz_attempts: int
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class QuizQuestion(BaseModel):
    question: str
    options: list[str]
    correct_answer_index: int
    explanation: str


class QuizResponse(BaseModel):
    questions: list[QuizQuestion]


class QuizSubmission(BaseModel):
    answers: list[int]
    questions: Optional[list[QuizQuestion]] = None


class QuizResult(BaseModel):
    score: float
    total_questions: int
    correct_answers: int
    questions_with_explanations: list[dict[str, Any]]
    passed: bool
    attempt_id: str


class EducationRecommendation(BaseModel):
    warnings: list[str]
    suggested_actions: list[str]
    tips: list[str]
    relevant_modules: list[dict[str, str]]
