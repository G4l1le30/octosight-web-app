from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# ===== MODULE SCHEMAS =====

class EducationArticleRead(BaseModel):
    id: int
    title: str
    url: str
    author: str
    duration_mins: int
    publication_date: Optional[datetime] = None
    description: Optional[str] = None
    
    class Config:
        from_attributes = True

class EducationModuleCreate(BaseModel):
    title: str
    level: str  # BASIC, BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
    order_index: int
    description: str
    duration_mins: int

class EducationModuleRead(BaseModel):
    id: int
    title: str
    level: str
    order_index: int
    description: str
    duration_mins: int
    articles: List[EducationArticleRead] = []
    
    class Config:
        from_attributes = True

class EducationModuleWithProgress(EducationModuleRead):
    status: str  # LOCKED, IN_PROGRESS, COMPLETED
    quiz_score: Optional[float] = None
    completed_at: Optional[datetime] = None

# ===== PROGRESS SCHEMAS =====

class UserLearningProgressCreate(BaseModel):
    user_id: str
    module_id: int

class UserLearningProgressUpdate(BaseModel):
    status: Optional[str] = None
    quiz_score: Optional[float] = None

class UserLearningProgressRead(BaseModel):
    id: int
    user_id: str
    module_id: int
    status: str
    quiz_score: Optional[float] = None
    quiz_attempts: int
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# ===== QUIZ SCHEMAS =====

class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer_index: int
    explanation: str

class QuizResponse(BaseModel):
    questions: List[QuizQuestion]

class QuizSubmission(BaseModel):
    answers: List[int]  # Index of selected answers

class QuizResult(BaseModel):
    score: float  # Percentage (0-100)
    total_questions: int
    correct_answers: int
    questions_with_explanations: List[dict]
    passed: bool  # True if score >= 70

# ===== EDUCATION RECOMMENDATION SCHEMA =====

class EducationRecommendation(BaseModel):
    warnings: List[str]
    suggested_actions: List[str]
    tips: List[str]
    relevant_modules: List[int]  # Module IDs yang relevant
