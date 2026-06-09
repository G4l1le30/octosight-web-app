"""tasks/retrain.py — Scheduled ML model retraining via External ML Service."""

import logging
import httpx
from celery_app import celery_app
from app.config import settings
from app.db.session import SessionLocal
from app.models.feedback import MLFeedback

logger = logging.getLogger("octosight.retrain")

@celery_app.task
def retrain_model():
    """
    Triggers the retraining process on the external ML service (Hugging Face).
    This task should be scheduled during low-traffic periods (e.g., 2 AM).
    """
    db = SessionLocal()
    try:
        # 1. Check if there is new feedback to justify a retrain
        feedback_count = db.query(MLFeedback).count()
        if feedback_count < 5: # Threshold to avoid unnecessary training
            logger.info(f"Only {feedback_count} feedback samples found. Skipping retrain.")
            return {"status": "skipped", "reason": "not enough data"}

        # 2. Get the retrain URL (base service URL + /retrain)
        if not settings.ml_service_url:
            logger.error("ML_SERVICE_URL is not configured. Cannot trigger retrain.")
            return {"status": "error", "reason": "ML_SERVICE_URL missing"}

        # Extract base URL (e.g., remove /predict if present)
        base_url = settings.ml_service_url.replace("/predict", "")
        retrain_url = f"{base_url}/retrain"
        
        # 3. Trigger the request
        # 'X-Retrain-Token' must match RETRAIN_TOKEN in Hugging Face Space secrets
        retrain_token = os.getenv("RETRAIN_TOKEN", "octosight_secret_2024")
        headers = {"X-Retrain-Token": retrain_token}
        
        logger.info(f"Triggering remote retrain at: {retrain_url}")
        
        with httpx.Client(timeout=30.0) as client:
            response = client.post(retrain_url, headers=headers)
            response.raise_for_status()
            
        logger.info("Remote retraining successfully triggered!")
        return {"status": "triggered", "remote_url": retrain_url}

    except httpx.HTTPStatusError as e:
        logger.error(f"Failed to trigger remote retrain: {e.response.status_code} - {e.response.text}")
        return {"status": "error", "error": f"HTTP {e.response.status_code}"}
    except Exception as e:
        logger.error(f"Retrain trigger failed: {str(e)}")
        return {"status": "error", "error": str(e)}
    finally:
        db.close()
