import json
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import HTTPException

from app.models.education import EducationArticle
from .repository import EducationRepository
from .gemini_service import GeminiEducationService

class EducationService:
    @staticmethod
    def get_modules_with_progress(db: Session, user_id: Optional[str]) -> List[Dict[str, Any]]:
        modules = EducationRepository.get_all_modules(db)
        result = []

        for module in modules:
            if user_id:
                progress = EducationRepository.get_user_progress(db, user_id, module.id)
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
                is_read = EducationRepository.get_article_progress(db, user_id, article.id) is not None if user_id else False
                articles_with_progress.append({
                    "id": article.id,
                    "title": article.title,
                    "url": article.url,
                    "author": article.author,
                    "duration_mins": article.duration_mins,
                    "publication_date": article.publication_date,
                    "description": article.description,
                    "image_url": article.image_url,
                    "content": article.content,
                    "is_read": is_read
                })

            result.append({
                "id": module.id,
                "title": module.title,
                "level": module.level,
                "order_index": module.order_index,
                "description": module.description,
                "duration_mins": module.duration_mins,
                "image_url": module.image_url,
                "articles": articles_with_progress,
                "status": None if not user_id else (progress.status if progress else "LOCKED"),
                "quiz_score": None if not user_id else (progress.quiz_score if progress else None),
                "completed_at": None if not user_id else (progress.completed_at if progress else None),
                "quiz_attempts_history": []
            })

        return result

    @staticmethod
    def get_module_detail(db: Session, user_id: Optional[str], module_id: str) -> Dict[str, Any]:
        module = EducationRepository.get_module_by_id(db, module_id)
        if not module:
            raise HTTPException(status_code=404, detail="Module not found")

        progress = None
        if user_id:
            progress = EducationRepository.get_user_progress(db, user_id, module_id)
            if not progress:
                status = "IN_PROGRESS" if module.order_index == 1 else "LOCKED"
                progress = EducationRepository.create_user_progress(db, user_id, module.id, status)

            if progress and progress.quiz_score and progress.quiz_score >= 70 and progress.status != "COMPLETED":
                progress.status = "COMPLETED"
                if not progress.completed_at:
                    progress.completed_at = datetime.now(timezone.utc)
                db.commit()

        articles_with_progress = []
        for article in module.articles:
            is_read = EducationRepository.get_article_progress(db, user_id, article.id) is not None if user_id else False
            articles_with_progress.append({
                "id": article.id,
                "title": article.title,
                "url": article.url,
                "author": article.author,
                "duration_mins": article.duration_mins,
                "publication_date": article.publication_date,
                "description": article.description,
                "image_url": article.image_url,
                "content": article.content,
                "is_read": is_read
            })

        attempts = EducationRepository.get_quiz_attempts(db, user_id, module_id) if user_id else []

        return {
            "id": module.id,
            "title": module.title,
            "level": module.level,
            "order_index": module.order_index,
            "description": module.description,
            "duration_mins": module.duration_mins,
            "image_url": module.image_url,
            "articles": articles_with_progress,
            "status": None if not user_id else (progress.status if progress else "LOCKED"),
            "quiz_score": None if not user_id else (progress.quiz_score if progress else None),
            "completed_at": None if not user_id else (progress.completed_at if progress else None),
            "quiz_attempts_history": attempts
        }

    @staticmethod
    def get_article_detail(db: Session, user_id: Optional[str], article_id: str) -> Dict[str, Any]:
        article = EducationRepository.get_article_by_id(db, article_id)
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")

        is_read = EducationRepository.get_article_progress(db, user_id, article.id) is not None if user_id else False

        # Enforce prerequisite: if authenticated and not first article, check previous article is read
        if user_id and article.order_index and article.order_index > 1:
            prev_article = db.query(EducationArticle).filter(
                EducationArticle.module_id == article.module_id,
                EducationArticle.order_index == article.order_index - 1
            ).first()
            if prev_article:
                prev_read = EducationRepository.get_article_progress(db, user_id, prev_article.id)
                if not prev_read:
                    raise HTTPException(status_code=403, detail="Complete the previous article first")

        module_title = ""
        module_id = ""
        next_article = None
        is_last_article = True
        if article.module:
            module_title = article.module.title
            module_id = article.module.id
            sorted_articles = sorted(article.module.articles, key=lambda a: a.order_index)
            for i, a in enumerate(sorted_articles):
                if a.id == article.id:
                    if i + 1 < len(sorted_articles):
                        nxt = sorted_articles[i + 1]
                        next_article = {"id": nxt.id, "title": nxt.title, "duration_mins": nxt.duration_mins}
                        is_last_article = False
                    break

        return {
            "id": article.id,
            "title": article.title,
            "url": article.url,
            "author": article.author,
            "duration_mins": article.duration_mins,
            "publication_date": article.publication_date,
            "description": article.description,
            "image_url": article.image_url,
            "content": article.content,
            "is_read": is_read,
            "module_id": module_id,
            "module_title": module_title,
            "next_article": next_article,
            "is_last_article": is_last_article
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
