from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.schemas.education import (
    EducationModuleWithProgress, QuizResponse, QuizSubmission, QuizResult
)
from app.modules.education.service import EducationService
from app.modules.education.repository import EducationRepository
from app.core.security import get_current_user

router = APIRouter(prefix="/api/v1/education", tags=["education"])

@router.get("/modules", response_model=List[EducationModuleWithProgress])
def get_all_modules(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Fetch all modules with current user's progress and completion status."""
    return EducationService.get_modules_with_progress(db, current_user.id)

@router.get("/modules/{module_id}", response_model=EducationModuleWithProgress)
def get_module_detail(
    module_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get detailed information about a specific module including its articles and quiz history."""
    return EducationService.get_module_detail(db, current_user.id, module_id)

@router.get("/modules/{module_id}/quiz-attempts/{attempt_id}")
def get_quiz_attempt(
    module_id: str,
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Retrieve details of a specific quiz attempt."""
    attempt = EducationRepository.get_quiz_attempt_by_id(db, attempt_id, current_user.id, module_id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    return attempt

@router.post("/articles/{article_id}/read")
def mark_article_as_read(
    article_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Mark an educational article as read by the current user."""
    return EducationService.mark_article_read(db, current_user.id, article_id)

@router.get("/modules/{module_id}/quiz", response_model=QuizResponse)
def get_quiz(
    module_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Generate or retrieve quiz questions for a specific module using AI."""
    quiz_data = EducationService.get_quiz_data(db, current_user.id, module_id)
    return QuizResponse(**quiz_data)

@router.post("/modules/{module_id}/submit-quiz", response_model=QuizResult)
def submit_quiz(
    module_id: str,
    submission: QuizSubmission,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Submit quiz answers, calculate score, and update user progress/achievements."""
    result = EducationService.process_quiz_submission(db, current_user.id, module_id, submission)
    return QuizResult(**result)

@router.post("/modules/{module_id}/complete")
def complete_module(
    module_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Explicitly mark a module as completed (requires a passing quiz score)."""
    # Note: Service already handles auto-completion in get_module_detail and submit_quiz,
    # but this endpoint is kept for manual triggers if needed.
    progress = EducationRepository.get_user_progress(db, current_user.id, module_id)
    if not progress:
        raise HTTPException(status_code=404, detail="Progress not found")
    if progress.quiz_score is None or progress.quiz_score < 70:
        raise HTTPException(status_code=400, detail="Must pass quiz first (>=70%)")
    
    from datetime import datetime, timezone
    progress.status = "COMPLETED"
    progress.completed_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Module completed", "module_id": module_id}
