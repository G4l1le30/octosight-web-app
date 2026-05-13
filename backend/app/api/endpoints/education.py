import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
from app.db.session import get_db
from app.models.education import EducationModule, EducationArticle, UserLearningProgress, UserArticleProgress, UserQuizAttempt
from app.schemas.education import (
    EducationModuleRead, EducationModuleWithProgress, QuizResponse, 
    QuizSubmission, QuizResult
)
from app.modules.education.gemini_service import GeminiEducationService
from app.core.security import get_current_user

router = APIRouter(prefix="/api/v1/education", tags=["education"])

@router.get("/modules", response_model=List[EducationModuleWithProgress])
def get_all_modules(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    modules = db.query(EducationModule).order_by(EducationModule.order_index).all()
    
    result = []
    for module in modules:
        progress = db.query(UserLearningProgress).filter(
            UserLearningProgress.user_id == current_user.id,
            UserLearningProgress.module_id == module.id
        ).first()
        
        if not progress:
            status = "IN_PROGRESS" if module.order_index == 1 else "LOCKED"
            progress = UserLearningProgress(
                user_id=current_user.id,
                module_id=module.id,
                status=status
            )
            db.add(progress)
            db.commit()
            db.refresh(progress)
        
        # Auto-correct status if they have a passing score
        if progress.quiz_score and progress.quiz_score >= 70 and progress.status != "COMPLETED":
            progress.status = "COMPLETED"
            if not progress.completed_at:
                progress.completed_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(progress)
        
        # Populate is_read for each article in this module
        articles_with_progress = []
        for article in module.articles:
            is_read = db.query(UserArticleProgress).filter(
                UserArticleProgress.user_id == current_user.id,
                UserArticleProgress.article_id == article.id
            ).first() is not None
            
            articles_with_progress.append({
                "id": article.id,
                "title": article.title,
                "url": article.url,
                "author": article.author,
                "duration_mins": article.duration_mins,
                "publication_date": article.publication_date,
                "description": article.description,
                "is_read": is_read
            })
            
        mod_dict = {
            "id": module.id,
            "title": module.title,
            "level": module.level,
            "order_index": module.order_index,
            "description": module.description,
            "duration_mins": module.duration_mins,
            "articles": articles_with_progress,
            "status": progress.status,
            "quiz_score": progress.quiz_score,
            "completed_at": progress.completed_at,
            "quiz_attempts_history": [] # Keep list lean
        }
        result.append(mod_dict)
    
    return result


@router.get("/modules/{module_id}", response_model=EducationModuleWithProgress)
def get_module_detail(
    module_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    module = db.query(EducationModule).filter(EducationModule.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    progress = db.query(UserLearningProgress).filter(
        UserLearningProgress.user_id == current_user.id,
        UserLearningProgress.module_id == module_id
    ).first()
    
    if not progress:
        status = "IN_PROGRESS" if module.order_index == 1 else "LOCKED"
        progress = UserLearningProgress(
            user_id=current_user.id,
            module_id=module.id,
            status=status
        )
        db.add(progress)
        db.commit()
        db.refresh(progress)
    
    # Auto-correct status if they have a passing score
    if progress.quiz_score and progress.quiz_score >= 70 and progress.status != "COMPLETED":
        progress.status = "COMPLETED"
        if not progress.completed_at:
            progress.completed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(progress)
    
    # Populate is_read for each article
    articles_with_progress = []
    for article in module.articles:
        is_read = db.query(UserArticleProgress).filter(
            UserArticleProgress.user_id == current_user.id,
            UserArticleProgress.article_id == article.id
        ).first() is not None
        
        articles_with_progress.append({
            "id": article.id,
            "title": article.title,
            "url": article.url,
            "author": article.author,
            "duration_mins": article.duration_mins,
            "publication_date": article.publication_date,
            "description": article.description,
            "is_read": is_read
        })
    
    # Fetch quiz attempts history
    attempts = db.query(UserQuizAttempt).filter(
        UserQuizAttempt.user_id == current_user.id,
        UserQuizAttempt.module_id == module_id
    ).order_by(UserQuizAttempt.created_at.asc()).all()
    
    return {
        "id": module.id,
        "title": module.title,
        "level": module.level,
        "order_index": module.order_index,
        "description": module.description,
        "duration_mins": module.duration_mins,
        "articles": articles_with_progress,
        "status": progress.status,
        "quiz_score": progress.quiz_score,
        "completed_at": progress.completed_at,
        "quiz_attempts_history": attempts
    }


@router.get("/modules/{module_id}/quiz-attempts/{attempt_id}")
def get_quiz_attempt(
    module_id: str,
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    attempt = db.query(UserQuizAttempt).filter(
        UserQuizAttempt.id == attempt_id,
        UserQuizAttempt.user_id == current_user.id,
        UserQuizAttempt.module_id == module_id
    ).first()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
        
    return attempt


@router.post("/articles/{article_id}/read")
def mark_article_as_read(
    article_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    article = db.query(EducationArticle).filter(EducationArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
        
    progress = db.query(UserArticleProgress).filter(
        UserArticleProgress.user_id == current_user.id,
        UserArticleProgress.article_id == article_id
    ).first()
    
    if not progress:
        progress = UserArticleProgress(
            user_id=current_user.id,
            article_id=article_id
        )
        db.add(progress)
        db.commit()
    
    return {"message": "Article marked as read", "article_id": article_id}


@router.get("/modules/{module_id}/quiz", response_model=QuizResponse)
def get_quiz(
    module_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    module = db.query(EducationModule).filter(EducationModule.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    progress = db.query(UserLearningProgress).filter(
        UserLearningProgress.user_id == current_user.id,
        UserLearningProgress.module_id == module_id
    ).first()
    
    if not progress or progress.status == "LOCKED":
        raise HTTPException(status_code=403, detail="Module is locked")
    
    articles = db.query(EducationArticle).filter(EducationArticle.module_id == module_id).all()
    article_titles = [article.title for article in articles]
    
    quiz_data = GeminiEducationService.generate_quiz_questions(
        module_order=module.order_index,
        module_title=module.title,
        module_description=module.description,
        article_titles=article_titles
    )
    
    return QuizResponse(**quiz_data)


@router.post("/modules/{module_id}/submit-quiz", response_model=QuizResult)
def submit_quiz(
    module_id: str,
    submission: QuizSubmission,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    module = db.query(EducationModule).filter(EducationModule.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    progress = db.query(UserLearningProgress).filter(
        UserLearningProgress.user_id == current_user.id,
        UserLearningProgress.module_id == module_id
    ).first()
    
    if not progress or progress.status == "LOCKED":
        raise HTTPException(status_code=403, detail="Module is locked")
        
    # Use questions sent from client (fetched during GET /quiz) to avoid a redundant Gemini call.
    # Fall back to generating if client did not supply questions (backward-compat).
    if submission.questions and len(submission.questions) > 0:
        quiz_data = {"questions": [q.model_dump() for q in submission.questions]}
    else:
        articles = db.query(EducationArticle).filter(EducationArticle.module_id == module_id).all()
        article_titles = [article.title for article in articles]
        quiz_data = GeminiEducationService.generate_quiz_questions(
            module_order=module.order_index,
            module_title=module.title,
            module_description=module.description,
            article_titles=article_titles
        )
    
    if len(submission.answers) != len(quiz_data["questions"]):
        raise HTTPException(status_code=400, detail="Invalid number of answers")

    correct_count = 0
    questions_with_explanations = []
    
    for i, answer_index in enumerate(submission.answers):
        question = quiz_data["questions"][i]
        is_correct = answer_index == question["correct_answer_index"]
        
        if is_correct:
            correct_count += 1
        
        questions_with_explanations.append({
            "question": question["question"],
            "selected_answer_index": answer_index,
            "correct_answer_index": question["correct_answer_index"],
            "is_correct": is_correct,
            "explanation": question["explanation"]
        })
    
    score = (correct_count / len(quiz_data["questions"])) * 100
    passed = score >= 70
    
    # Update best score
    best_score = max(progress.quiz_score or 0, score)
    progress.quiz_score = best_score
    progress.quiz_attempts += 1
    
    # Save the attempt history
    new_attempt = UserQuizAttempt(
        user_id=current_user.id,
        module_id=module_id,
        score=score,
        passed=1 if passed else 0,
        attempt_number=progress.quiz_attempts,
        details=json.dumps(questions_with_explanations)
    )
    db.add(new_attempt)
    db.flush()
    
    # A module is completed if the BEST score is >= 70
    if best_score >= 70:
        progress.status = "COMPLETED"
        if not progress.completed_at:
            progress.completed_at = datetime.now(timezone.utc)
        
        # Unlock next module
        next_module = db.query(EducationModule).filter(
            EducationModule.order_index == module.order_index + 1
        ).first()
        
        if next_module:
            next_progress = db.query(UserLearningProgress).filter(
                UserLearningProgress.user_id == current_user.id,
                UserLearningProgress.module_id == next_module.id
            ).first()
            
            if not next_progress:
                next_progress = UserLearningProgress(
                    user_id=current_user.id,
                    module_id=next_module.id,
                    status="IN_PROGRESS"
                )
                db.add(next_progress)
            elif next_progress.status == "LOCKED":
                next_progress.status = "IN_PROGRESS"
    
    db.commit()
    
    return QuizResult(
        score=score,
        total_questions=len(quiz_data["questions"]),
        correct_answers=correct_count,
        questions_with_explanations=questions_with_explanations,
        passed=passed,
        attempt_id=new_attempt.id
    )


@router.post("/modules/{module_id}/complete")
def complete_module(
    module_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    progress = db.query(UserLearningProgress).filter(
        UserLearningProgress.user_id == current_user.id,
        UserLearningProgress.module_id == module_id
    ).first()
    
    if not progress:
        raise HTTPException(status_code=404, detail="Progress not found")
    
    if progress.quiz_score is None or progress.quiz_score < 70:
        raise HTTPException(status_code=400, detail="Must pass quiz first (>=70%)")
    
    progress.status = "COMPLETED"
    progress.completed_at = datetime.now(timezone.utc)
    db.commit()
    
    return {"message": "Module completed", "module_id": module_id}
