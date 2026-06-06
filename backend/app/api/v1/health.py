"""health.py — Health check endpoint with dependency verification."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.config import settings
import os
import importlib

router = APIRouter(tags=["health"])


@router.get("/")
def health_check(db: Session = Depends(get_db)):
    """Return system health status including DB, Redis, and ML model checks."""
    status = {"status": "OctoSight API Active", "version": "1.0.0"}
    checks = {}

    # Database check
    try:
        db.execute(db.bind.dialect.statement.compile(dialect=db.bind.dialect).__class__.__module__ and "SELECT 1")
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as e:
        checks["database"] = f"error: {e}"

    # Redis check
    redis_url = settings.redis_url or os.getenv("REDIS_URL", "")
    if redis_url:
        try:
            import redis
            r = redis.from_url(redis_url, socket_connect_timeout=3)
            r.ping()
            checks["redis"] = "ok"
            r.close()
        except Exception as e:
            checks["redis"] = f"error: {e}"
    else:
        checks["redis"] = "not configured"

    # ML model check
    model_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        settings.ml_model_path,
    )
    if os.path.exists(model_path):
        try:
            model_size = os.path.getsize(model_path)
            checks["ml_model"] = f"ok ({model_size // 1024} KB)"
        except Exception as e:
            checks["ml_model"] = f"error: {e}"
    else:
        checks["ml_model"] = "not found"

    status["checks"] = checks
    status["healthy"] = checks.get("database") == "ok"
    return status
