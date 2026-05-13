import json
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime, timezone
from fastapi import HTTPException

from .repository import EducationRepository
from .gemini_service import GeminiEducationService

class EducationService:
    @staticmethod
    def get_modules_with_progress(db: Session, user_id: str) -> List[Dict[str, Any]]:
        modules = EducationRepository.get_all_modules(db)
        result = []
        
        for module in modules:
            progress = EducationRepository.get_user_progress(db, user_id, module.id)
            
            if not progress:
                status = "IN_PROGRESS" if module.order_index == 1 else "LOCKED"
                progress = EducationRepository.create_user_progress(db, user_id, module.id, status)
            
            # Auto-correct status if they have a passing score
            if progress.quiz_score and progress.quiz_score >= 70 and progress.status != "COMPLETED":
                progress.status = "COMPLETED"
                if not progress.completed_at:
                    progress.completed_at = datetime.now(timezone.utc)
                db.commit()
            
            articles_with_progress = []
            for article in module.articles:
                is_read = EducationRepository.get_article_progress(db, user_id, article.id) is not None
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
                
            result.append({
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
                "quiz_attempts_history": []
            })
            
        return result

    @staticmethod
    def get_module_detail(db: Session, user_id: str, module_id: str) -> Dict[str, Any]:
        module = EducationRepository.get_module_by_id(db, module_id)
        if not module:
            raise HTTPException(status_code=404, detail="Module not found")
            
        progress = EducationRepository.get_user_progress(db, user_id, module_id)
        if not progress:
            status = "IN_PROGRESS" if module.order_index == 1 else "LOCKED"
            progress = EducationRepository.create_user_progress(db, user_id, module.id, status)
            
        if progress.quiz_score and progress.quiz_score >= 70 and progress.status != "COMPLETED":
            progress.status = "COMPLETED"
            if not progress.completed_at:
                progress.completed_at = datetime.now(timezone.utc)
            db.commit()
            
        articles_with_progress = []
        for article in module.articles:
            is_read = EducationRepository.get_article_progress(db, user_id, article.id) is not None
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
            
        attempts = EducationRepository.get_quiz_attempts(db, user_id, module_id)
        
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

    @staticmethod
    def mark_article_read(db: Session, user_id: str, article_id: str) -> Dict[str, str]:
        from app.models.education import EducationArticle
        article = db.query(EducationArticle).filter(EducationArticle.id == article_id).first()
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")
            
        progress = EducationRepository.get_article_progress(db, user_id, article_id)
        if not progress:
            EducationRepository.mark_article_as_read(db, user_id, article_id)
            
        return {"message": "Article marked as read", "article_id": article_id}

    @staticmethod
    def get_quiz_data(db: Session, user_id: str, module_id: str) -> Dict[str, Any]:
        module = EducationRepository.get_module_by_id(db, module_id)
        if not module:
            raise HTTPException(status_code=404, detail="Module not found")
            
        progress = EducationRepository.get_user_progress(db, user_id, module_id)
        if not progress or progress.status == "LOCKED":
            raise HTTPException(status_code=403, detail="Module is locked")
            
        articles = EducationRepository.get_articles_by_module(db, module_id)
        article_titles = [article.title for article in articles]
        
        return GeminiEducationService.generate_quiz_questions(
            module_order=module.order_index,
            module_title=module.title,
            module_description=module.description,
            article_titles=article_titles
        )

    @staticmethod
    def process_quiz_submission(db: Session, user_id: str, module_id: str, submission: Any) -> Dict[str, Any]:
        module = EducationRepository.get_module_by_id(db, module_id)
        if not module:
            raise HTTPException(status_code=404, detail="Module not found")
            
        progress = EducationRepository.get_user_progress(db, user_id, module_id)
        if not progress or progress.status == "LOCKED":
            raise HTTPException(status_code=403, detail="Module is locked")
            
        if submission.questions and len(submission.questions) > 0:
            quiz_data = {"questions": [q.model_dump() for q in submission.questions]}
        else:
            articles = EducationRepository.get_articles_by_module(db, module_id)
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
            if is_correct: correct_count += 1
            
            questions_with_explanations.append({
                "question": question["question"],
                "selected_answer_index": answer_index,
                "correct_answer_index": question["correct_answer_index"],
                "is_correct": is_correct,
                "explanation": question["explanation"]
            })
            
        score = (correct_count / len(quiz_data["questions"])) * 100
        passed = score >= 70
        
        current_best = progress.quiz_score or 0
        if score > current_best:
            progress.quiz_score = score
            
        progress.quiz_attempts += 1
        best_score = progress.quiz_score
        
        new_attempt = EducationRepository.create_quiz_attempt(
            db, user_id, module_id, score, passed, progress.quiz_attempts, json.dumps(questions_with_explanations)
        )
        
        if best_score >= 70:
            progress.status = "COMPLETED"
            if not progress.completed_at:
                progress.completed_at = datetime.now(timezone.utc)
            
            next_module = EducationRepository.get_module_by_order(db, module.order_index + 1)
            if next_module:
                next_progress = EducationRepository.get_user_progress(db, user_id, next_module.id)
                if not next_progress:
                    EducationRepository.create_user_progress(db, user_id, next_module.id, "IN_PROGRESS")
                elif next_progress.status == "LOCKED":
                    next_progress.status = "IN_PROGRESS"
        
        db.commit()
        
        return {
            "score": score,
            "total_questions": len(quiz_data["questions"]),
            "correct_answers": correct_count,
            "questions_with_explanations": questions_with_explanations,
            "passed": passed,
            "attempt_id": new_attempt.id
        }
