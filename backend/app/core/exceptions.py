"""
exceptions.py — Custom HTTP exception hierarchy.

All API errors are raised as typed exceptions and caught by error_handlers.py.
"""

from typing import Any, Optional


class AppException(Exception):
    """Base exception for all application-level errors."""

    status_code: int = 500
    detail: str = "Internal server error"
    extra: Optional[dict[str, Any]] = None

    def __init__(
        self, detail: Optional[str] = None, extra: Optional[dict[str, Any]] = None
    ):
        if detail is not None:
            self.detail = detail
        self.extra = extra
        super().__init__(self.detail)


class NotFoundException(AppException):
    status_code = 404
    detail = "Resource not found"


class UnauthorizedException(AppException):
    status_code = 401
    detail = "Not authenticated"


class ForbiddenException(AppException):
    status_code = 403
    detail = "Access denied"


class BadRequestException(AppException):
    status_code = 400
    detail = "Bad request"


class ConflictException(AppException):
    status_code = 409
    detail = "Resource already exists"


class ValidationException(AppException):
    status_code = 422
    detail = "Validation error"


class RateLimitException(AppException):
    status_code = 429
    detail = "Too many requests"


class ServiceUnavailableException(AppException):
    status_code = 503
    detail = "Service temporarily unavailable"
