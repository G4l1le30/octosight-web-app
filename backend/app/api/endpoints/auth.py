"""
routers/auth.py — Authentication endpoints.

Routes:
  POST /api/v1/auth/register  Register a new user (role = 'user')
  POST /api/v1/auth/login     Authenticate and set httpOnly JWT cookie
  GET  /api/v1/auth/me        Return current user profile
  POST /api/v1/auth/logout    Clear the auth cookie
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.models.models import User
from app.schemas.schemas import LoginRequest, RegisterRequest, UserResponse

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

_COOKIE_MAX_AGE = 86400  # 24 hours in seconds


@router.post("/register", response_model=UserResponse, summary="Register a new user")
def register(data: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    """
    Create a new user account. Role is always forced to 'user'.
    Returns user profile and sets an httpOnly JWT cookie.
    """
    if not data.email or "@" not in data.email:
        raise HTTPException(status_code=400, detail="Invalid email address")

    if db.query(User).filter(User.email == data.email.lower().strip()).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        id=str(uuid.uuid4()),
        full_name=data.full_name.strip(),
        email=data.email.lower().strip(),
        hashed_password=hash_password(data.password),
        role="user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(
        {"sub": str(user.id), "email": user.email, "role": user.role}
    )
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=_COOKIE_MAX_AGE,
        path="/",
    )
    return UserResponse(
        id=user.id, full_name=user.full_name, email=user.email, role=user.role
    )


@router.post("/login", response_model=UserResponse, summary="Login and receive JWT cookie")
def login(data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """
    Authenticate with email + password.
    Sets an httpOnly JWT cookie on success.
    """
    user = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(
        {"sub": str(user.id), "email": user.email, "role": user.role}
    )
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=_COOKIE_MAX_AGE,
        path="/",
    )
    return UserResponse(
        id=user.id, full_name=user.full_name, email=user.email, role=user.role
    )


@router.get("/me", response_model=UserResponse, summary="Get current user profile")
def get_me(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return UserResponse(
        id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        role=current_user.role,
    )


@router.post("/logout", summary="Clear auth cookie")
def logout(response: Response):
    """Delete the JWT cookie, effectively logging the user out."""
    response.delete_cookie(key="access_token", path="/")
    return {"message": "Logged out successfully"}
