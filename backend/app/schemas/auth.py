"""auth.py — Pydantic schemas for authentication."""

import re
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator


class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[^a-zA-Z0-9]", v):
            raise ValueError("Password must contain at least one special character")
        return v


class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleLoginRequest(BaseModel):
    credential: str


class UserResponse(BaseModel):
    id: str
    full_name: str
    email: str
    role: str
    auth_provider: str = "email"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class DeleteAccountRequest(BaseModel):
    password: str


class RequestDeletionRequest(BaseModel):
    password: Optional[str] = None


class ConfirmDeletionRequest(BaseModel):
    token: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    password: str


class GoogleLoginRequest(BaseModel):
    credential: str


class UserResponse(BaseModel):
    id: str
    full_name: str
    email: str
    role: str
    auth_provider: str = "email"

    class Config:
        from_attributes = True


class DeleteAccountRequest(BaseModel):
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
