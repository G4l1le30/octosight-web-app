"""auth/service.py — Authentication business logic.

Handles registration, login, Google OAuth, token management,
email verification, and account lockout.
"""

import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
)
from app.core.email_validation import (
    EmailValidationError,
    EmailValidationUnavailableError,
    normalize_and_validate_real_email,
)
from app.core.exceptions import (
    BadRequestException,
    UnauthorizedException,
    ServiceUnavailableException,
    ConflictException,
)
from app.modules.auth.repository import UserRepository
from app.models.user import User


class AuthService:
    """Authentication business operations."""

    @staticmethod
    def validate_email(email: str) -> str:
        try:
            return normalize_and_validate_real_email(email)
        except EmailValidationError as exc:
            raise BadRequestException(str(exc))
        except EmailValidationUnavailableError as exc:
            raise ServiceUnavailableException(str(exc))

    @staticmethod
    def register(db: Session, full_name: str, email: str, password: str) -> str:
        """Validate and return normalized email. User creation happens on email verify."""
        normalized_email = AuthService.validate_email(email)

        if UserRepository.email_exists(db, normalized_email):
            raise ConflictException("Email is already registered. Please sign in instead.")

        return normalized_email

    @staticmethod
    def create_signup_token(full_name: str, email: str, password: str) -> str:
        signup_payload = {
            "full_name": full_name.strip(),
            "email": email,
            "password": hash_password(password),
            "exp": datetime.now(timezone.utc) + timedelta(minutes=30),
            "type": "signup",
        }
        return jwt.encode(signup_payload, SECRET_KEY, algorithm=ALGORITHM)

    @staticmethod
    def verify_signup_token(db: Session, token: str) -> User:
        """Verify signup token and create user if not exists. Returns user."""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            if payload.get("type") != "signup":
                raise BadRequestException("Invalid token type.")
            email = payload.get("email")
            full_name = payload.get("full_name")
            hashed_password = payload.get("password")
        except JWTError:
            raise BadRequestException("Verification link is invalid or has expired.")

        user = UserRepository.get_by_email(db, email)
        if not user:
            user = UserRepository.create(
                db,
                user_id=str(uuid.uuid4()),
                full_name=full_name,
                email=email,
                hashed_password=hashed_password,
                role="user",
            )
        return user

    @staticmethod
    def login(db: Session, email: str, password: str) -> User:
        """Authenticate user. Raises on failure."""
        normalized_email = AuthService.validate_email(email)
        user = UserRepository.get_by_email(db, normalized_email)

        if not user:
            raise UnauthorizedException("No account found for this email. Please register first.")

        if UserRepository.is_locked(user):
            raise UnauthorizedException("Account is locked. Please try again later.")

        # Reset lockout if expired
        if user.locked_until:
            UserRepository.reset_lockout(db, user)

        if not verify_password(password, user.hashed_password):
            UserRepository.increment_failed_logins(db, user)
            raise UnauthorizedException("Incorrect password for this email address.")

        UserRepository.reset_lockout(db, user)
        return user

    @staticmethod
    def issue_tokens(user: User) -> dict[str, str]:
        """Create access + refresh token pair."""
        access = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
        refresh = create_refresh_token({"sub": str(user.id)})
        return {"access_token": access, "refresh_token": refresh}

    @staticmethod
    def verify_google_credential(credential: str) -> dict:
        """Verify Google OAuth credential and return user info dict."""
        import json as _json
        import urllib.request

        email = None
        full_name = None

        try:
            req = urllib.request.Request(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {credential}"},
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                user_info = _json.loads(resp.read().decode())
                email = user_info.get("email", "").lower().strip()
                full_name = user_info.get("name", "Google User")
        except Exception:
            pass

        if not email:
            from google.oauth2 import id_token as google_id_token
            from google.auth.transport import requests as google_requests

            try:
                id_info = google_id_token.verify_oauth2_token(
                    credential, google_requests.Request(), settings.google_client_id
                )
                email = id_info.get("email", "").lower().strip()
                full_name = id_info.get("name", "Google User")
            except ValueError:
                raise UnauthorizedException("Google token verification failed")

        return {"email": email, "full_name": full_name or "Google User"}

    @staticmethod
    def refresh_access_token(db: Session, refresh_token_str: str) -> tuple[str, User]:
        """Validate refresh token and issue new access token. Returns (token, user)."""
        try:
            payload = jwt.decode(refresh_token_str, SECRET_KEY, algorithms=[ALGORITHM])
            if payload.get("type") != "refresh":
                raise UnauthorizedException("Invalid token type")
            user_id = payload.get("sub")
            if not user_id:
                raise UnauthorizedException("Invalid token payload")
        except JWTError:
            raise UnauthorizedException("Invalid or expired refresh token")

        user = UserRepository.get_by_id(db, user_id)
        if not user:
            raise UnauthorizedException("User not found")

        new_access = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
        return new_access, user

    @staticmethod
    def build_confirmation_url(token: str) -> str:
        api_url = settings.api_public_url.rstrip("/")
        return f"{api_url}/api/v1/auth/verify?token={token}"
