from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.db.session import get_db
from app.models.education import EducationModule, EducationArticle, UserLearningProgress
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
        
        # We need to manually populate the response since articles might need to be resolved.
        # In dict form or object form Pydantic will handle it if we return the ORM object and pass status
        # Better to return dict
        mod_dict = {
            "id": module.id,
            "title": module.title,
            "level": module.level,
            "order_index": module.order_index,
            "description": module.description,
            "duration_mins": module.duration_mins,
            "articles": module.articles,
            "status": progress.status,
            "quiz_score": progress.quiz_score,
            "completed_at": progress.completed_at
        }
        result.append(mod_dict)
    
    return result


@router.get("/modules/{module_id}", response_model=EducationModuleWithProgress)
def get_module_detail(
    module_id: int,
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
        raise HTTPException(status_code=403, detail="Module locked or not accessible")
    
    return {
        "id": module.id,
        "title": module.title,
        "level": module.level,
        "order_index": module.order_index,
        "description": module.description,
        "duration_mins": module.duration_mins,
        "articles": module.articles,
        "status": progress.status,
        "quiz_score": progress.quiz_score,
        "completed_at": progress.completed_at
    }


@router.get("/modules/{module_id}/quiz", response_model=QuizResponse)
def get_quiz(
    module_id: int,
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
        module_id=module_id,
        module_title=module.title,
        module_description=module.description,
        article_titles=article_titles
    )
    
    return QuizResponse(**quiz_data)


@router.post("/modules/{module_id}/submit-quiz", response_model=QuizResult)
def submit_quiz(
    module_id: int,
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
        
    articles = db.query(EducationArticle).filter(EducationArticle.module_id == module_id).all()
    article_titles = [article.title for article in articles]
    quiz_data = GeminiEducationService.generate_quiz_questions(
        module_id=module_id,
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
    
    progress.quiz_score = score
    progress.quiz_attempts += 1
    
    if passed:
        progress.status = "COMPLETED"
        progress.completed_at = datetime.utcnow()
        
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
            else:
                next_progress.status = "IN_PROGRESS"
    else:
        progress.status = "IN_PROGRESS"
    
    db.commit()
    
    return QuizResult(
        score=score,
        total_questions=len(quiz_data["questions"]),
        correct_answers=correct_count,
        questions_with_explanations=questions_with_explanations,
        passed=passed
    )


@router.post("/modules/{module_id}/complete")
def complete_module(
    module_id: int,
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
    progress.completed_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Module completed", "module_id": module_id}
