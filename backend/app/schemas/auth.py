"""auth.py — Pydantic schemas for authentication."""

from typing import Optional
from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str


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
