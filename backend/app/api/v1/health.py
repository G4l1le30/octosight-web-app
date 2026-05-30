"""
health.py — Health check endpoint.
"""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/")
def health_check():
    return {"status": "OctoSight API Active", "version": "1.0.0"}
