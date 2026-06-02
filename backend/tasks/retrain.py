"""tasks/retrain.py — Scheduled ML model retraining."""

import csv
import json
import logging
import os
import shutil
import subprocess
import sys

from celery_app import celery_app
from app.db.session import SessionLocal
from app.models.feedback import MLFeedback
from app.models.ticket import Ticket

logger = logging.getLogger("octosight.retrain")


@celery_app.task
def retrain_model():
    """Collect MLFeedback from DB, call ml/train.py, copy artifacts, reload engine."""
    db = SessionLocal()
    try:
        feedbacks = db.query(MLFeedback).order_by(MLFeedback.created_at.desc()).all()
        if not feedbacks:
            logger.info("No ML feedback found. Skipping retrain.")
            return {"status": "skipped", "samples": 0}

        ticket_ids = list({f.ticket_id for f in feedbacks})
        tickets = db.query(Ticket).filter(Ticket.ticket_id.in_(ticket_ids)).all()
        ticket_map = {t.ticket_id: t for t in tickets}

        label_map = {"tp": "phishing", "fp": "not phishing", "tn": "not phishing", "fn": "phishing"}
        rows = []
        for fb in feedbacks:
            ticket = ticket_map.get(fb.ticket_id)
            text = (ticket.summary or "") if ticket else ""
            if not text:
                text = (ticket.url or fb.notes or "")
            rows.append({"text": text, "label": label_map.get(fb.feedback_type.lower(), "not phishing")})

        backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        export_dir = os.path.join(backend_root, "..", "ml", "datasets")
        os.makedirs(export_dir, exist_ok=True)
        export_path = os.path.join(export_dir, "celery_training_data.csv")

        with open(export_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=["text", "label"])
            writer.writeheader()
            writer.writerows(rows)

        artifacts_dir = os.path.join(backend_root, "..", "ml", "artifacts")
        train_script = os.path.join(backend_root, "..", "ml", "train.py")

        result = subprocess.run(
            [sys.executable, train_script, "--data-path", export_path, "--output-dir", artifacts_dir],
            capture_output=True, text=True, timeout=600,
        )
        if result.returncode != 0:
            logger.error("Retrain failed: %s", result.stderr[:500])
            return {"status": "error", "error": result.stderr[:500]}

        backend_models = os.path.join(backend_root, "models")
        os.makedirs(backend_models, exist_ok=True)
        for name in ("model.pkl", "vectorizer.pkl"):
            src = os.path.join(artifacts_dir, name)
            dst = os.path.join(backend_models, f"spam_pipeline.pkl" if name == "model.pkl" else name)
            if os.path.exists(src):
                shutil.copy2(src, dst)

        import importlib
        from app.core import ml_engine
        importlib.reload(ml_engine)

        eval_path = os.path.join(artifacts_dir, "eval_report.json")
        metrics = {}
        if os.path.exists(eval_path):
            with open(eval_path) as f:
                metrics = json.load(f)

        logger.info("Model retrained: %d samples", len(rows))
        return {"status": "success", "samples": len(rows), "eval_metrics": metrics}
    except Exception as exc:
        logger.error("Retrain failed: %s", exc)
        return {"status": "error", "error": str(exc)}
    finally:
        db.close()
