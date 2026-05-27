"""
main.py — OctoSight FastAPI application entry point.
"""

import os
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import OperationalError

from app.db.session import Base, SessionLocal, engine
from app.db.migrations import apply_migrations
from app.db.education_seeding import seed_education_data
from app.models.models import Ticket, User, BlacklistedURL, BlacklistedAccount, MockBankTransaction, BlacklistedPhone, BlacklistedEmail, TicketAuditLog  # noqa: F401 — ensures table is created
from app.core.email_validation import (
    EmailValidationError,
    EmailValidationUnavailableError,
    normalize_and_validate_real_email,
)
from app.core.security import hash_password, limiter
from slowapi.errors import RateLimitExceeded

from app.api.endpoints import auth as auth_router
from app.api.endpoints import tickets as tickets_router
from app.api.endpoints import detection as detection_router
from app.api.endpoints import education as education_router
from app.api.endpoints import blacklist as blacklist_router
from app.api.endpoints import evidence as evidence_router

# ── Startup Logic ─────────────────────────────────────────────────────────────

def _seed_db(db) -> None:
    """Seed a default admin account and minimal dummy tickets if the DB is empty."""
    # Admin account
    admin_email = (os.getenv("DEFAULT_ADMIN_EMAIL") or "").strip()
    admin_password = os.getenv("DEFAULT_ADMIN_PASSWORD")

    if admin_email:
        try:
            admin_email = normalize_and_validate_real_email(admin_email)
        except EmailValidationUnavailableError:
            print("[Seed] Skipping admin user creation because email deliverability validation is temporarily unavailable.")
            admin_email = ""
        except EmailValidationError as exc:
            print(f"[Seed] Skipping admin user creation because DEFAULT_ADMIN_EMAIL is invalid: {exc}")
            admin_email = ""

    if admin_email and admin_password and not db.query(User).filter(User.email == admin_email).first():
        db.add(
            User(
                id=str(uuid.uuid4()),
                full_name="OctoSight Admin",
                email=admin_email,
                hashed_password=hash_password(admin_password),
                role="admin",
            )
        )
        db.commit()
        print(f"[Seed] Admin user created: {admin_email}")

    # Dummy tickets (only if table is completely empty)
    if db.query(Ticket).count() == 0:
        dummy = [
            Ticket(
                ticket_id="OCTO-8825",
                url="https://clmbniaga-bonus.tk/claim",
                type="Website",
                risk_score=95,
                rule_score=80,
                ml_score=100,
                priority="High",
                status="Submitted",
                flags="punycode_detected,suspicious_tld,ml_prediction:phishing",
            ),
            Ticket(
                ticket_id="OCTO-8821",
                url="https://cimb-niaga-verif.net/login",
                type="Website",
                risk_score=92,
                rule_score=75,
                ml_score=100,
                priority="High",
                status="In Review",
                flags="brand_impersonation,ml_prediction:phishing",
            ),
            Ticket(
                ticket_id="OCTO-8822",
                url="https://security-cimb.xyz/blocked",
                type="Website",
                risk_score=88,
                rule_score=70,
                ml_score=98,
                priority="High",
                status="Submitted",
                flags="suspicious_tld,ml_prediction:phishing",
            ),
        ]
        db.add_all(dummy)
        db.commit()
        print(f"[Seed] {len(dummy)} dummy tickets created")

    # Mock Bank Transactions (simulated valid CIMB transactions)
    # Check if OCTO-REF-001 exists, if not, re-seed the core CIMB data
    if db.query(MockBankTransaction).filter(MockBankTransaction.reference_number == "OCTO-REF-001").count() == 0:
        # Clear old/partial mock data to prevent conflicts
        db.query(MockBankTransaction).delete()
        mock_txs = [
            MockBankTransaction(
                reference_number="OCTO-REF-001", 
                sender_name="Budi CIMB User", 
                sender_account="706123456789", 
                sender_bank="CIMB NIAGA",
                receiver_account="704987654321",
                receiver_bank="CIMB NIAGA",
                amount=500000.0
            ),
            MockBankTransaction(
                reference_number="OCTO-REF-002", 
                sender_name="Siti Niaga", 
                sender_account="701234555111", 
                sender_bank="CIMB NIAGA",
                receiver_account="704987654321",
                receiver_bank="CIMB NIAGA",
                amount=1250000.0
            ),
            MockBankTransaction(
                reference_number="OCTO-REF-003", 
                sender_name="Dedi Oktoman", 
                sender_account="705556667770", 
                sender_bank="CIMB NIAGA",
                receiver_account="704987654321",
                receiver_bank="CIMB NIAGA",
                amount=200000.0
            ),
        ]
        db.add_all(mock_txs)
        db.commit()
        print(f"[Seed] {len(mock_txs)} mock CIMB transactions created/updated")

    # Blacklisted Accounts (known scammers)
    if db.query(BlacklistedAccount).count() == 0:
        bad_accounts = [
            BlacklistedAccount(account_number="1234567890", bank_name="OCTO Virtual", reason="Penipuan modus salah kirim"),
            BlacklistedAccount(account_number="081234567890", bank_name="E-Wallet Scam", reason="Dompet digital penipu barang fiktif"),
        ]
        db.add_all(bad_accounts)
        db.commit()
        print(f"[Seed] {len(bad_accounts)} blacklisted accounts created")

    # Blacklisted Phones
    if db.query(BlacklistedPhone).count() == 0:
        bad_phones = [
            BlacklistedPhone(phone_number="08968554576", reason="Spam penipuan anak kecelakaan"),
            BlacklistedPhone(phone_number="08123456789", reason="SMS phishing hadiah palsu"),
        ]
        db.add_all(bad_phones)
        db.commit()
        print(f"[Seed] {len(bad_phones)} blacklisted phones created")

    # Blacklisted Emails
    if db.query(BlacklistedEmail).count() == 0:
        bad_emails = [
            BlacklistedEmail(email="scammer@urgent-cimb.com", reason="Email impersonasi CIMB NIAGA"),
            BlacklistedEmail(email="admin@secure-payment.xyz", reason="Email phishing payment gateway"),
        ]
        db.add_all(bad_emails)
        db.commit()
        print(f"[Seed] {len(bad_emails)} blacklisted emails created")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Wait for DB, create schema, migrate, seed."""
    retries = 10
    while retries > 0:
        try:
            Base.metadata.create_all(bind=engine)
            db = SessionLocal()
            try:
                apply_migrations(db)
                _seed_db(db)
                seed_education_data(db)
            finally:
                db.close()
            print("[Startup] Database ready.")
            break
        except OperationalError as exc:
            retries -= 1
            print(f"[Startup] DB not ready, retrying... ({retries} left) — {exc}")
            time.sleep(5)
    
    if retries == 0:
        print("[Startup] ERROR: Could not connect to database after 10 retries.")
    
    yield

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="OctoSight API",
    description=(
        "Anti-phishing and fraud detection API for digital banking. "
        "Risk scores are computed using a hybrid Rule Engine (35%) + "
        "ML Engine (65%) pipeline."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """Custom handler to return clear error message when spamming."""
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={"detail": "Too many requests. Please wait a moment before trying again."},
    )

# ── Middleware ─────────────────────────────────────────────────────────────────

allowed_origins = os.getenv(
    "ALLOWED_ORIGINS", 
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add standard security headers to all responses."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# ── Static file serving ────────────────────────────────────────────────────────

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ── Exception Handlers ────────────────────────────────────────────────────────

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Custom handler to prevent 'UnicodeDecodeError' when a validation error 
    occurs on a request containing binary data (like images).
    """
    errors = []
    for err in exc.errors():
        err_dict = dict(err)
        
        # Mask sensitive fields like password
        loc = err_dict.get("loc", [])
        if any(str(l).lower() in ["password", "credential", "token"] for l in loc):
            if "input" in err_dict:
                err_dict["input"] = "***MASKED***"
                
        if "ctx" in err_dict and "error" in err_dict["ctx"]:
            err_dict["ctx"] = dict(err_dict["ctx"])
            err_dict["ctx"]["error"] = str(err_dict["ctx"]["error"])
        errors.append(err_dict)

    print(f"--- Request Validation Error ---")
    print(f"Path: {request.url.path}")
    print(f"Errors: {errors}")
    print(f"-------------------------------")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Invalid input provided. Please check your form data.",
            "errors": errors
        },
    )

# ── Routes ────────────────────────────────────────────────────────────────────

app.include_router(auth_router.router)
app.include_router(tickets_router.router)
app.include_router(detection_router.router)
app.include_router(education_router.router)
app.include_router(blacklist_router.router)
app.include_router(evidence_router.router)

# ── Health check ───────────────────────────────────────────────────────────────

@app.get("/", tags=["health"])
def health_check():
    return {"status": "OctoSight API Active", "version": "1.0.0"}
