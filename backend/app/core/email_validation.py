"""Utilities for validating real user email addresses."""

from email_validator import EmailNotValidError, validate_email


class EmailValidationError(ValueError):
    """Raised when an email address is malformed or non-deliverable."""


class EmailValidationUnavailableError(RuntimeError):
    """Raised when deliverability checks cannot be completed reliably."""


def normalize_and_validate_real_email(email: str) -> str:
    """
    Normalize an email address and require a deliverable mailbox domain.

    This rejects malformed addresses and domains that do not accept email.
    It does not prove mailbox ownership; that requires a verification flow.
    """
    candidate = (email or "").strip()
    if not candidate:
        raise EmailValidationError("Email is required.")

    try:
        validated = validate_email(candidate, check_deliverability=True)
    except EmailNotValidError as exc:
        message = str(exc).strip()
        lowered = message.lower()

        if "timed out" in lowered or "temporary" in lowered or "dns" in lowered:
            raise EmailValidationUnavailableError(
                "Email validation is temporarily unavailable. Please try again in a moment."
            ) from exc

        if (
            "deliverable" in lowered
            or "accept email" in lowered
            or "mail exchanger" in lowered
            or "domain name" in lowered
            or "does not exist" in lowered
        ):
            raise EmailValidationError(
                "Use a real email address with a mail domain that can receive email. Dummy or non-deliverable email addresses are not allowed."
            ) from exc

        raise EmailValidationError(
            "Use a valid email address format, for example name@example.com."
        ) from exc

    return validated.normalized.lower()
