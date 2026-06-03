"""
error_handlers.py — Global exception handler registration.

Keeps main.py clean by moving all exception handler definitions here.
"""

import logging
import traceback

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from app.core.exceptions import AppException

logger = logging.getLogger("octosight")


def register_error_handlers(app: FastAPI) -> None:
    """Register all global exception handlers on the FastAPI app."""

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": exc.detail,
                **(exc.extra if exc.extra else {}),
            },
        )

    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "detail": "Too many requests. Please wait a moment before trying again."
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_handler(request: Request, exc: RequestValidationError):
        errors = []
        for err in exc.errors():
            err_dict = dict(err)
            loc = err_dict.get("loc", [])
            if any(str(l).lower() in {"password", "credential", "token"} for l in loc):
                if "input" in err_dict:
                    err_dict["input"] = "***MASKED***"
            if "ctx" in err_dict and "error" in err_dict["ctx"]:
                err_dict["ctx"] = dict(err_dict["ctx"])
                err_dict["ctx"]["error"] = str(err_dict["ctx"]["error"])
            errors.append(err_dict)

        logger.warning("Request validation error — path=%s errors=%s", request.url.path, errors)

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": "Invalid input provided. Please check your form data.", "errors": errors},
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error("Unhandled exception — path=%s method=%s", request.url.path, request.method)
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "An internal server error occurred. Please try again later.",
                "error_type": type(exc).__name__,
            },
        )
