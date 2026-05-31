"""ml.py — ML admin endpoints: retrain, stats, model info."""

import os
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import require_admin
from app.db.session import get_db
from app.models.feedback import MLFeedback
from app.models.ticket import Ticket

router = APIRouter(prefix="/ml", tags=["ml"])

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "models")
EVAL_REPORT_PATH = os.path.join(MODEL_DIR, "spam_pipeline.pkl")


@router.get("/stats")
def get_ml_stats(
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Return ML feedback statistics for the admin dashboard."""
    total = db.query(MLFeedback).count()
    tp = db.query(MLFeedback).filter(MLFeedback.feedback_type == "tp").count()
    fp = db.query(MLFeedback).filter(MLFeedback.feedback_type == "fp").count()
    fn = db.query(MLFeedback).filter(MLFeedback.feedback_type == "fn").count()
    tn = db.query(MLFeedback).filter(MLFeedback.feedback_type == "tn").count()

    # Check model file info
    model_exists = os.path.exists(EVAL_REPORT_PATH)
    model_modified = None
    if model_exists:
        mtime = os.path.getmtime(EVAL_REPORT_PATH)
        model_modified = datetime.fromtimestamp(mtime, tz=timezone.utc).isoformat()

    accuracy = None
    if total > 0:
        correct = tp + tn
        accuracy = round((correct / total) * 100, 1)

    return {
        "total_feedback": total,
        "tp": tp,
        "fp": fp,
        "fn": fn,
        "tn": tn,
        "accuracy": accuracy,
        "model_exists": model_exists,
        "last_modified": model_modified,
        "model_path": os.path.abspath(EVAL_REPORT_PATH) if model_exists else None,
    }


@router.post("/retrain")
def retrain_model(
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Trigger ML model retraining using accumulated feedback.

    Collects labeled data from ml_feedback table, combines with existing
    training data, and retrains the model. New model is saved with version tag.
    """
    # Collect feedback
    feedbacks = db.query(MLFeedback).all()
    if len(feedbacks) < 10:
        raise HTTPException(
            status_code=400,
            detail=f"Need at least 10 feedback entries to retrain. Currently have {len(feedbacks)}.",
        )

    # Gather ticket summaries + labels
    training_data = []
    for fb in feedbacks:
        ticket = db.query(Ticket).filter(Ticket.ticket_id == fb.ticket_id).first()
        if ticket:
            text = f"{ticket.url or ''} {ticket.summary or ''} {ticket.flags or ''}"
            label = "spam" if fb.feedback_type in ("tp", "fn") else "ham"
            training_data.append({"text": text.strip(), "label": label})

    if not training_data:
        raise HTTPException(status_code=400, detail="No valid training data found from feedback.")

    # Version tag
    version = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

    try:
        import joblib
        from sklearn.linear_model import LogisticRegression
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.pipeline import Pipeline
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import accuracy_score

        texts = [d["text"] for d in training_data]
        labels = [d["label"] for d in training_data]

        X_train, X_test, y_train, y_test = train_test_split(texts, labels, test_size=0.2, random_state=42)

        pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(max_features=5000, ngram_range=(1, 2))),
            ("clf", LogisticRegression(max_iter=1000, random_state=42)),
        ])
        pipeline.fit(X_train, y_train)

        y_pred = pipeline.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)

        # Save retrained model
        retrain_dir = os.path.join(MODEL_DIR, "retrained")
        os.makedirs(retrain_dir, exist_ok=True)
        model_path = os.path.join(retrain_dir, f"spam_pipeline_{version}.pkl")
        joblib.dump(pipeline, model_path)

        # Save eval report
        report = {
            "version": version,
            "accuracy": round(accuracy * 100, 2),
            "training_samples": len(training_data),
            "feedback_count": len(feedbacks),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        report_path = os.path.join(retrain_dir, f"eval_report_{version}.json")
        with open(report_path, "w") as f:
            json.dump(report, f, indent=2)

        return {
            "status": "retrained",
            "version": version,
            "accuracy": round(accuracy * 100, 2),
            "training_samples": len(training_data),
            "model_path": model_path,
            "note": "Model saved but not yet loaded. Deploy new model by copying to models/spam_pipeline.pkl and restarting.",
        }

    except ImportError as e:
        raise HTTPException(status_code=500, detail=f"ML dependencies not available: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retrain failed: {e}")
