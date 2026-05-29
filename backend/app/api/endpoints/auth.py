"""
routers/auth.py — Authentication endpoints.

Routes:
  POST /api/v1/auth/register  Register a new user (role = 'user')
  POST /api/v1/auth/login     Authenticate and set httpOnly JWT cookie
  GET  /api/v1/auth/me        Return current user profile
  POST /api/v1/auth/logout    Clear the auth cookie
"""

import os
import uuid
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, Response, BackgroundTasks, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests
from jose import jwt, JWTError

from app.core.email_validation import (
    EmailValidationError,
    EmailValidationUnavailableError,
    normalize_and_validate_real_email,
)
from app.core.security import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
    create_access_token,
    create_refresh_token,
    get_current_user,
    hash_password,
    verify_password,
    limiter,
    SECRET_KEY,
    ALGORITHM,
)
from app.db.session import get_db
from app.models.models import User
from app.schemas.schemas import LoginRequest, RegisterRequest, UserResponse, GoogleLoginRequest
from fastapi import Request
from app.modules.notifications.service import send_email_notification

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

_ACCESS_COOKIE_MAX_AGE = ACCESS_TOKEN_EXPIRE_MINUTES * 60
_REFRESH_COOKIE_MAX_AGE = REFRESH_TOKEN_EXPIRE_DAYS * 86400


def _is_production() -> bool:
    return os.getenv("ENVIRONMENT") == "production"


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    is_production = _is_production()
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=_ACCESS_COOKIE_MAX_AGE,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=_REFRESH_COOKIE_MAX_AGE,
        path="/",
    )


def _clear_auth_cookies(response: Response) -> None:
    is_production = _is_production()
    response.delete_cookie(
        key="access_token",
        path="/",
        secure=is_production,
        httponly=True,
        samesite="lax",
    )
    response.delete_cookie(
        key="refresh_token",
        path="/",
        secure=is_production,
        httponly=True,
        samesite="lax",
    )


def _validated_email_or_http_error(email: str) -> str:
    """Validate a user-supplied email and convert failures to HTTP errors."""
    try:
        return normalize_and_validate_real_email(email)
    except EmailValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except EmailValidationUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/register", status_code=status.HTTP_201_CREATED, summary="Initiate user registration")
@limiter.limit("1/minute")
def register(request: Request, data: RegisterRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Initiates registration by sending a verification email. 
    The user is NOT added to the database until they confirm their email.
    """
    normalized_email = _validated_email_or_http_error(data.email)

    if db.query(User).filter(User.email == normalized_email).first():
        raise HTTPException(status_code=400, detail="Email is already registered. Please sign in instead.")

    # Create a signup token containing user info (valid for 30 minutes)
    signup_payload = {
        "full_name": data.full_name.strip(),
        "email": normalized_email,
        "password": hash_password(data.password),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=30),
        "type": "signup"
    }
    signup_token = jwt.encode(signup_payload, SECRET_KEY, algorithm=ALGORITHM)
    
    # Use environment variable for public URL to avoid being trapped in the internal Docker network
    api_public_url = os.getenv("API_PUBLIC_URL", "http://localhost:8000").rstrip("/")
    confirmation_url = f"{api_public_url}/api/v1/auth/verify?token={signup_token}"

    send_email_notification(
        background_tasks=background_tasks,
        subject="Confirm your email address to start using OctoSight",
        email_to=normalized_email,
        template_name="verify_email.html",
        template_body={"confirmation_url": confirmation_url, "user_name": data.full_name, "user_email": normalized_email}
    )

    return {
        "status": "success",
        "message": "Registration link sent! Please check your email inbox and spam folder to verify your account. You must verify your email before you can sign in.",
        "requires_verification": True,
        "session_established": False
    }


@router.get("/verify", response_model=UserResponse, summary="Confirm email and complete registration")
def verify_email(token: str, response: Response, db: Session = Depends(get_db)):
    """
    Verifies the signup token, creates the user if they don't exist, and logs them in.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "signup":
            raise HTTPException(status_code=400, detail="Invalid token type.")
        
        email = payload.get("email")
        full_name = payload.get("full_name")
        hashed_password = payload.get("password")
    except JWTError:
        raise HTTPException(status_code=400, detail="Verification link is invalid or has expired.")

    # Check if user already exists (handles duplicate clicks on the confirmation link)
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            id=str(uuid.uuid4()),
            full_name=full_name,
            email=email,
            hashed_password=hashed_password,
            role="user",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Auto-login after verification (allows redirect even if already registered)
    access_token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    # Redirect to homepage after successful login
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    redirect_resp = RedirectResponse(url=f"{frontend_url}", status_code=307)
    
    # Set cookies on the redirect response
    _set_auth_cookies(redirect_resp, access_token, refresh_token)
    return redirect_resp


@router.post("/login", response_model=UserResponse, summary="Login and receive JWT cookie")
@limiter.limit("5/minute")
def login(request: Request, data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """
    Authenticate with email + password.
    Sets an httpOnly JWT cookie on success.
    """
    normalized_email = _validated_email_or_http_error(data.email)
    user = db.query(User).filter(User.email == normalized_email).first()

    if user:
        if user.locked_until and user.locked_until > datetime.now(timezone.utc).replace(tzinfo=None):
            raise HTTPException(status_code=423, detail="Account is locked. Please try again later.")
        elif user.locked_until:
            # Lockout expired, reset
            user.failed_login_attempts = 0
            user.locked_until = None
            db.commit()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="No account found for this email. Please register first using the same real email address.",
        )

    if not verify_password(data.password, user.hashed_password):
        if user:
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 5:
                user.locked_until = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=15)
            db.commit()
        raise HTTPException(status_code=401, detail="Incorrect password for this email address.")

    # Reset attempts on success
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()

    token = create_access_token(
        {"sub": str(user.id), "email": user.email, "role": user.role}
    )
    refresh_token = create_refresh_token(
        {"sub": str(user.id)}
    )
    _set_auth_cookies(response, token, refresh_token)
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
    """Delete the JWT cookies, effectively logging the user out."""
    _clear_auth_cookies(response)
    return {"message": "Logged out successfully"}


@router.post("/google/login", response_model=UserResponse, summary="Sign in with Google")
@limiter.limit("5/minute")
def google_login(request: Request, data: GoogleLoginRequest, response: Response, db: Session = Depends(get_db)):
    import urllib.request
    import json

    email = None

    try:
        req = urllib.request.Request(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {data.credential}"}
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            user_info = json.loads(resp.read().decode())
            email = user_info.get("email").lower().strip()
    except Exception:
        pass

    if not email:
        try:
            id_info = id_token.verify_oauth2_token(
                data.credential, 
                requests.Request(), 
                GOOGLE_CLIENT_ID
            )
            email = id_info.get("email").lower().strip()
        except ValueError:
            raise HTTPException(status_code=401, detail="Google token verification failed")

    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Account not found. Please sign up first.")
        
    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    _set_auth_cookies(response, token, refresh_token)
    
    return UserResponse(id=user.id, full_name=user.full_name, email=user.email, role=user.role)

@router.post("/google/register", response_model=UserResponse, summary="Register with Google")
@limiter.limit("5/minute")
def google_register(
    request: Request,
    data: GoogleLoginRequest,
    response: Response,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    import urllib.request
    import json

    email = None
    full_name = None

    try:
        req = urllib.request.Request(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {data.credential}"}
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            user_info = json.loads(resp.read().decode())
            email = user_info.get("email").lower().strip()
            full_name = user_info.get("name", "Google User")
    except Exception:
        pass

    if not email:
        try:
            id_info = id_token.verify_oauth2_token(
                data.credential, 
                requests.Request(), 
                GOOGLE_CLIENT_ID
            )
            email = id_info.get("email").lower().strip()
            full_name = id_info.get("name", "Google User")
        except ValueError:
            raise HTTPException(status_code=401, detail="Google token verification failed")

    user = db.query(User).filter(User.email == email).first()
    
    if user:
        raise HTTPException(status_code=400, detail="Account already exists. Please sign in.")
        
    user = User(
        id=str(uuid.uuid4()),
        full_name=full_name,
        email=email,
        hashed_password=hash_password(str(uuid.uuid4())), 
        role="user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    send_email_notification(
        background_tasks=background_tasks,
        subject="Welcome to OctoSight",
        email_to=user.email,
        template_name="verify_email.html",
        template_body={"user_name": user.full_name, "user_email": user.email}
    )
    
    # Immediate login for Google users
    access_token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    _set_auth_cookies(response, access_token, refresh_token)
    
    return UserResponse(id=user.id, full_name=user.full_name, email=user.email, role=user.role)

@router.post("/refresh", summary="Refresh access token")
def refresh_token(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
            
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    new_access_token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    is_production = _is_production()
    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=_ACCESS_COOKIE_MAX_AGE,
        path="/",
    )
    return {"message": "Token refreshed"}
