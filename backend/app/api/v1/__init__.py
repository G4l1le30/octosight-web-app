"""
api/v1/__init__.py — Master router for all API v1 endpoints.
"""

from fastapi import APIRouter

from app.api.v1 import health
from app.api.v1 import dashboard
from app.api.v1 import tickets
from app.api.v1 import rule_config
from app.api.v1 import notifications
from app.api.v1 import activity
from app.api.v1 import users

v1_router = APIRouter(prefix="/api/v1")

v1_router.include_router(health.router)
v1_router.include_router(dashboard.router)
v1_router.include_router(tickets.router)
v1_router.include_router(rule_config.router)
v1_router.include_router(notifications.router)
v1_router.include_router(activity.router)
v1_router.include_router(users.router)
