"""
main.py — OctoSight FastAPI application entry point.

This file is intentionally thin. All business logic lives in:
  routers/auth.py       — authentication
  routers/tickets.py    — ticket CRUD
  routers/detection.py  — hybrid phishing analysis & ML prediction

Startup sequence:
  1. Wait for MySQL to be ready (retry loop)
  2. Create all ORM tables via metadata
  3. Apply idempotent column migrations
  4. Run seed data (admin user + dummy tickets)
"""

import os
import time
import uuid

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import OperationalError

from app.db.session import Base, SessionLocal, engine
from app.db.migrations import apply_migrations
from app.models.models import Ticket, User
from app.core.security import hash_password

from app.api.endpoints import auth as auth_router
from app.api.endpoints import tickets as tickets_router
from app.api.endpoints import detection as detection_router

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="OctoSight API",
    description=(
        "Anti-phishing and fraud detection API for digital banking. "
        "Risk scores are computed using a hybrid Rule Engine (35%) + "
        "ML Engine (65%) pipeline."
    ),
    version="1.0.0",
)

# ── Middleware ─────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    print(f"--- Request Validation Error ---")
    print(f"Path: {request.url.path}")
    print(f"Errors: {exc.errors()}")
    print(f"-------------------------------")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Invalid input provided. Please check your form data.",
            "errors": str(exc.errors())
        },
    )

# ── Routes ────────────────────────────────────────────────────────────────────

app.include_router(auth_router.router)
app.include_router(tickets_router.router)
app.include_router(detection_router.router)


# ── Startup ────────────────────────────────────────────────────────────────────

def _seed_db(db) -> None:
    """Seed a default admin account and minimal dummy tickets if the DB is empty."""
    # Admin account
    admin_email = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@octosight.id")
    admin_password = os.getenv("DEFAULT_ADMIN_PASSWORD", "admin1234")
    
    if not db.query(User).filter(User.email == admin_email).first():
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
        print(f"[Seed] Admin user created: {admin_email} / ********")

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


@app.on_event("startup")
def startup_event() -> None:
    """Wait for DB, create schema, migrate, seed."""
    retries = 10
    while retries > 0:
        try:
            Base.metadata.create_all(bind=engine)
            db = SessionLocal()
            try:
                apply_migrations(db)
                _seed_db(db)
            finally:
                db.close()
            print("[Startup] Database ready.")
            return
        except OperationalError as exc:
            retries -= 1
            print(f"[Startup] DB not ready, retrying... ({retries} left) — {exc}")
            time.sleep(5)

    print("[Startup] ERROR: Could not connect to database after 10 retries.")


# ── Health check ───────────────────────────────────────────────────────────────

@app.get("/", tags=["health"])
def health_check():
    return {"status": "OctoSight API Active", "version": "1.0.0"}
