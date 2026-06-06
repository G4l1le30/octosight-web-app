"""
celery_app.py — OctoSight Celery application.

Task queue broker is Redis (set via ``REDIS_URL`` env var).
Celery Beat schedule is defined here for periodic tasks.
"""

from celery import Celery

from app.config import settings

celery_app = Celery(
    "octosight",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "sla-breach-check": {
            "task": "tasks.sla.check_sla_breaches",
            "schedule": 1800.0,
        },
        "url-rescan": {
            "task": "tasks.url_rescan.rescan_24h_tickets",
            "schedule": 3600.0,
        },
        "weekly-ml-retrain": {
            "task": "tasks.retrain.retrain_model",
            "schedule": 604800.0,
        },
    },
    imports=[
        "tasks.sla",
        "tasks.url_rescan",
        "tasks.retrain",
    ],
)
