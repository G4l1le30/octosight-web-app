"""users.py — Admin user management API endpoints (v1, admin only)."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.core.security import require_admin, get_current_user, hash_password
from app.db.session import get_db
from app.models.user import User
from app.core.exceptions import NotFoundException, BadRequestException

router = APIRouter(prefix="/admin/users", tags=["admin", "users"])


class UpdateUserRequest(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


@router.get("")
def list_users(
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """List all users (admin only)."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        {
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active if hasattr(u, "is_active") else True,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


@router.get("/{user_id}")
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Get single user details."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User not found")
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active if hasattr(u, "is_active") else True,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@router.patch("/{user_id}")
def update_user(
    user_id: str,
    body: UpdateUserRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Update user details (role, active status, password)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User not found")

    if body.role is not None:
        if body.role not in ("user", "moderator", "admin"):
            raise BadRequestException("Invalid role. Must be user, moderator, or admin")
        user.role = body.role

    if body.full_name is not None:
        user.full_name = body.full_name

    if body.is_active is not None:
        user.is_active = body.is_active

    if body.password:
        user.hashed_password = hash_password(body.password)

    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active if hasattr(user, "is_active") else True,
        "message": "User updated successfully",
    }
