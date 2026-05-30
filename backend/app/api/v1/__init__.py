"""
api/v1/__init__.py — Master router for all API v1 endpoints.
"""

from fastapi import APIRouter

from app.api.v1 import health
from app.api.v1 import dashboard
from app.api.v1 import tickets

v1_router = APIRouter(prefix="/api/v1")

v1_router.include_router(health.router)
v1_router.include_router(dashboard.router)
v1_router.include_router(tickets.router)
