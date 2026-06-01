"""
main.py — OctoSight FastAPI application entry point.

Uses the refactored architecture:
- config.py for all env vars
- core/error_handlers.py for exception registration
- api/v1/ for new versioned endpoints
- Existing api/endpoints/ for backward compat (migration in progress)
"""

import os
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.db.migrations import apply_migrations, run_alembic_migrations
from app.db.education_seeding import seed_education_data
from app.models import (
    Ticket,
    User,
    BlacklistedURL,
    BlacklistedAccount,
    MockBankTransaction,
    BlacklistedPhone,
    BlacklistedEmail,
    TicketAuditLog,
    RuleConfig,
    Permission,
    RolePermission,
)
from app.core.email_validation import (
    EmailValidationError,
    EmailValidationUnavailableError,
    normalize_and_validate_real_email,
)
from app.core.security import hash_password, limiter
from app.core.error_handlers import register_error_handlers
from app.modules.rule_config.service import RuleConfigService

# Backward-compat routers (migrating to api/v1/)
from app.api.endpoints import auth as auth_router
from app.api.endpoints import tickets as tickets_router
from app.api.endpoints import detection as detection_router
from app.api.endpoints import education as education_router
from app.api.endpoints import blacklist as blacklist_router
from app.api.endpoints import evidence as evidence_router

# New v1 router
from app.api.v1 import v1_router


# ── Startup Logic ─────────────────────────────────────────────────────────────

def _seed_db(db) -> None:
    """Seed default admin account, dummy tickets, mock bank data, and blacklists."""
    admin_email = (settings.default_admin_email or "").strip()
    admin_password = settings.default_admin_password

    if admin_email:
        try:
            admin_email = normalize_and_validate_real_email(admin_email)
        except EmailValidationUnavailableError:
            print("[Seed] Skipping admin user creation — email deliverability validation unavailable.")
            admin_email = ""
        except EmailValidationError as exc:
            print(f"[Seed] Skipping admin user — DEFAULT_ADMIN_EMAIL invalid: {exc}")
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

    # Dummy tickets
    if db.query(Ticket).count() == 0:
        dummy = [
            Ticket(
                ticket_id="OCTO-8825",
                url="https://clmbniaga-bonus.tk/claim",
                type="Website",
                risk_score=95, rule_score=80, ml_score=100,
                priority="High", status="Submitted",
                flags="punycode_detected,suspicious_tld,ml_prediction:phishing",
                summary="Fake CIMB bonus claim page with typosquatting domain",
            ),
            Ticket(
                ticket_id="OCTO-8821",
                url="https://cimb-niaga-verif.net/login",
                type="Website",
                risk_score=92, rule_score=75, ml_score=100,
                priority="High", status="In Review",
                flags="brand_impersonation,ml_prediction:phishing",
                summary="Credential harvesting page impersonating CIMB login",
            ),
            Ticket(
                ticket_id="OCTO-8822",
                url="https://security-cimb.xyz/blocked",
                type="Website",
                risk_score=88, rule_score=70, ml_score=98,
                priority="High", status="Submitted",
                flags="suspicious_tld,ml_prediction:phishing",
                summary="Fake security alert page requesting bank credentials",
            ),
            Ticket(
                ticket_id="OCTO-8830",
                sender_numbers="+6281234567890",
                type="SMS",
                risk_score=85, rule_score=65, ml_score=95,
                priority="High", status="Confirmed",
                flags="urgency_language,ml_prediction:phishing",
                summary="SMS claiming account frozen, click link to verify",
            ),
            Ticket(
                ticket_id="OCTO-8831",
                sender_numbers="+6285678901234",
                type="WhatsApp",
                risk_score=78, rule_score=60, ml_score=88,
                priority="Medium", status="Submitted",
                flags="ml_prediction:phishing",
                summary="WhatsApp message about unclaimed prize from CIMB",
            ),
            Ticket(
                ticket_id="OCTO-8832",
                url="https://secure-cimb-login.com/auth",
                type="Website",
                risk_score=72, rule_score=55, ml_score=82,
                priority="Medium", status="In Review",
                flags="suspicious_tld,brand_impersonation",
                summary="Lookalike domain with login form targeting CIMB users",
            ),
            Ticket(
                ticket_id="OCTO-8833",
                sender_numbers="+6289876543210",
                type="SMS",
                risk_score=65, rule_score=50, ml_score=72,
                priority="Medium", status="Mitigated",
                flags="ml_prediction:phishing",
                summary="SMS with shortened URL claiming tax refund",
            ),
            Ticket(
                ticket_id="OCTO-8834",
                url="https://cimb-update.info/verify",
                type="Email",
                risk_score=55, rule_score=40, ml_score=65,
                priority="Low", status="False Positive",
                flags="suspicious_tld",
                summary="Email about account verification from non-official domain",
            ),
            Ticket(
                ticket_id="OCTO-8835",
                sender_numbers="+6281122334455",
                type="WhatsApp",
                risk_score=42, rule_score=30, ml_score=50,
                priority="Low", status="Closed",
                flags="",
                summary="Suspicious WhatsApp forward about CIMB promo",
            ),
            Ticket(
                ticket_id="OCTO-8836",
                url="https://promo-cimbniaga.com/reward",
                type="Website",
                risk_score=80, rule_score=65, ml_score=90,
                priority="High", status="Submitted",
                flags="brand_impersonation,urgency_language,ml_prediction:phishing",
                summary="Promotional reward claiming page with account input form",
            ),
            Ticket(
                ticket_id="OCTO-8837",
                sender_numbers="+6287766554433",
                type="SMS",
                risk_score=70, rule_score=55, ml_score=78,
                priority="Medium", status="In Review",
                flags="urgency_language",
                summary="SMS warning of unauthorized transaction, asks to call number",
            ),
            Ticket(
                ticket_id="OCTO-8838",
                url="https://cimbniaga-secure.id/login",
                type="Website",
                risk_score=90, rule_score=75, ml_score=98,
                priority="High", status="Submitted",
                flags="suspicious_tld,punycode_detected,ml_prediction:phishing",
                summary="Punycode domain mimicking CIMB Niaga login page",
            ),
            Ticket(
                ticket_id="OCTO-8839",
                sender_numbers="+6283344556677",
                type="Email",
                risk_score=48, rule_score=35, ml_score=58,
                priority="Low", status="Closed",
                flags="ml_prediction:phishing",
                summary="Email with fake invoice attachment from unknown sender",
            ),
            Ticket(
                ticket_id="OCTO-8840",
                url="https://bit.ly/fake-cimb",
                type="Website",
                risk_score=82, rule_score=70, ml_score=88,
                priority="High", status="Confirmed",
                flags="shortened_url,brand_impersonation,ml_prediction:phishing",
                summary="Shortened URL redirecting to credential harvesting page",
            ),
            Ticket(
                ticket_id="OCTO-8841",
                sender_numbers="+6284455667788",
                type="WhatsApp",
                risk_score=75, rule_score=60, ml_score=82,
                priority="Medium", status="Submitted",
                flags="urgency_language,ml_prediction:phishing",
                summary="WhatsApp message claiming urgent account security update",
            ),
        ]
        db.add_all(dummy)
        db.commit()
        print(f"[Seed] {len(dummy)} dummy tickets created")

    # Mock bank transactions
    if db.query(MockBankTransaction).filter(MockBankTransaction.reference_number == "OCTO-REF-001").count() == 0:
        db.query(MockBankTransaction).delete()
        mock_txs = [
            MockBankTransaction(
                reference_number="OCTO-REF-001", sender_name="Budi CIMB User",
                sender_account="706123456789", sender_bank="CIMB NIAGA",
                receiver_account="704987654321", receiver_bank="CIMB NIAGA",
                amount=500000.0,
            ),
            MockBankTransaction(
                reference_number="OCTO-REF-002", sender_name="Siti Niaga",
                sender_account="701234555111", sender_bank="CIMB NIAGA",
                receiver_account="704987654321", receiver_bank="CIMB NIAGA",
                amount=1250000.0,
            ),
            MockBankTransaction(
                reference_number="OCTO-REF-003", sender_name="Dedi Oktoman",
                sender_account="705556667770", sender_bank="CIMB NIAGA",
                receiver_account="704987654321", receiver_bank="CIMB NIAGA",
                amount=200000.0,
            ),
        ]
        db.add_all(mock_txs)
        db.commit()
        print(f"[Seed] {len(mock_txs)} mock CIMB transactions created/updated")

    # Blacklisted accounts
    if db.query(BlacklistedAccount).count() == 0:
        db.add_all([
            BlacklistedAccount(account_number="1234567890", bank_name="OCTO Virtual", reason="Penipuan modus salah kirim"),
            BlacklistedAccount(account_number="081234567890", bank_name="E-Wallet Scam", reason="Dompet digital penipu barang fiktif"),
        ])
        db.commit()
        print("[Seed] blacklisted accounts created")

    # Blacklisted phones
    if db.query(BlacklistedPhone).count() == 0:
        db.add_all([
            BlacklistedPhone(phone_number="08968554576", reason="Spam penipuan anak kecelakaan"),
            BlacklistedPhone(phone_number="08123456789", reason="SMS phishing hadiah palsu"),
        ])
        db.commit()
        print("[Seed] blacklisted phones created")

    # Blacklisted emails
    if db.query(BlacklistedEmail).count() == 0:
        db.add_all([
            BlacklistedEmail(email="scammer@urgent-cimb.com", reason="Email impersonasi CIMB NIAGA"),
            BlacklistedEmail(email="admin@secure-payment.xyz", reason="Email phishing payment gateway"),
        ])
        db.commit()
        print("[Seed] blacklisted emails created")

    # Rule config defaults
    RuleConfigService.seed_default_rules(db)

    # ── Permissions & role mappings ────────────────────────────────────────────
    if db.query(Permission).count() == 0:
        perm_defs = {
            # dashboard
            "dashboard.view": "View main dashboard",
            "dashboard.view_team": "View team-level dashboard stats",
            # tickets
            "tickets.view": "View ticket list and details",
            "tickets.create": "Submit a new report / ticket",
            "tickets.update_status": "Change ticket status",
            "tickets.assign": "Assign ticket to a user",
            "tickets.comment": "Add comments to a ticket",
            "tickets.bulk_update": "Perform bulk status updates",
            "tickets.export": "Export tickets to CSV",
            # investigate
            "investigate.view": "View investigation details",
            "investigate.update_notes": "Update investigation notes",
            "investigate.update_status": "Change investigation status",
            "investigate.generate_notes": "Generate AI-based notes",
            # blacklist
            "blacklist.view": "View blacklist entries",
            "blacklist.add": "Add entry to blacklist",
            "blacklist.remove": "Remove entry from blacklist",
            # rules
            "rules.view": "View detection rules",
            "rules.create": "Create new detection rule",
            "rules.update": "Edit existing detection rule",
            "rules.deactivate": "Deactivate a detection rule",
            # ml
            "ml.view_stats": "View ML model stats and charts",
            "ml.submit_feedback": "Submit feedback on ML predictions",
            "ml.retrain": "Trigger ML model retraining",
            # users
            "users.view": "View user list",
            "users.update_role": "Change user roles",
            "users.activate_deactivate": "Activate or deactivate users",
            # transactions
            "transactions.view": "View mock transactions",
            "transactions.create": "Add new transaction",
            "transactions.delete": "Delete a transaction",
            "transactions.analyze": "Run anomaly analysis on transactions",
            # education
            "education.view": "View education modules and articles",
            "education.complete_modules": "Complete education modules",
            "education.manage_content": "Create/edit/delete education content",
            # notifications
            "notifications.view_own": "View own notifications",
            "notifications.manage_channels": "Configure notification channels",
        }

        perm_objects = {}
        for code, desc in perm_defs.items():
            p = Permission(code=code, description=desc)
            db.add(p)
            perm_objects[code] = p
        db.flush()

        # Role → permission mappings
        role_perms = {
            "user": [
                "education.view",
                "education.complete_modules",
                "tickets.create",
                "notifications.view_own",
            ],
            "cs": [
                "education.view",
                "education.complete_modules",
                "tickets.view",
                "tickets.comment",
                "notifications.view_own",
            ],
            "analyst": [
                "dashboard.view",
                "tickets.view",
                "tickets.assign",
                "tickets.comment",
                "investigate.view",
                "investigate.comment",
                "ml.submit_feedback",
                "education.view",
                "education.complete_modules",
                "rules.view",
                "notifications.view_own",
            ],
            "investigator": [
                "dashboard.view",
                "tickets.view",
                "tickets.assign",
                "tickets.comment",
                "investigate.view",
                "investigate.update_notes",
                "investigate.update_status",
                "blacklist.view",
                "blacklist.add",
                "transactions.view",
                "transactions.analyze",
                "education.view",
                "education.complete_modules",
                "rules.view",
                "ml.submit_feedback",
                "notifications.view_own",
            ],
            "moderator": [
                "dashboard.view",
                "dashboard.view_team",
                "tickets.view",
                "tickets.assign",
                "tickets.comment",
                "tickets.bulk_update",
                "tickets.export",
                "investigate.view",
                "investigate.update_notes",
                "investigate.update_status",
                "investigate.generate_notes",
                "blacklist.view",
                "blacklist.add",
                "blacklist.remove",
                "rules.view",
                "rules.create",
                "rules.update",
                "rules.deactivate",
                "ml.view_stats",
                "ml.submit_feedback",
                "transactions.view",
                "transactions.analyze",
                "education.view",
                "education.complete_modules",
                "notifications.view_own",
                "notifications.manage_channels",
            ],
            "viewer": [
                "dashboard.view",
                "tickets.view",
                "investigate.view",
                "blacklist.view",
                "rules.view",
                "ml.view_stats",
                "transactions.view",
                "education.view",
            ],
        }

        for role, perm_codes in role_perms.items():
            for code in perm_codes:
                if code in perm_objects:
                    db.add(RolePermission(role=role, permission_id=perm_objects[code].id))
        db.commit()
        print(f"[Seed] {len(perm_defs)} permissions created with role mappings")


# ── Lifespan ────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Wait for DB, create schema, migrate, seed."""
    retries = 10
    while retries > 0:
        try:
            run_alembic_migrations()
            Base.metadata.create_all(bind=engine)
            db = SessionLocal()
            try:
                apply_migrations(db)
                _seed_db(db)
                seed_education_data(db)
                # Load dynamic rules into the singleton rule engine
                from app.core.engines import rule_engine
                db_rules = RuleConfigService.load_all_active(db)
                rule_engine.load_from_db(db_rules)
                print(f"[Startup] Rule engine refreshed with {len(db_rules.get('keywords', []))} keywords from DB.")
            finally:
                db.close()
            print("[Startup] Database ready.")
            break
        except Exception as exc:
            retries -= 1
            print(f"[Startup] DB not ready, retrying... ({retries} left) — {exc}")
            time.sleep(5)

    if retries == 0:
        print("[Startup] ERROR: Could not connect to database after 10 retries.")

    yield


# ── App Factory ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="OctoSight API",
    description=(
        "Anti-phishing and fraud detection API for digital banking. "
        "Risk scores are computed using a hybrid Rule Engine (35%) + "
        "ML Engine (65%) pipeline."
    ),
    version="1.2.0",
    lifespan=lifespan,
)

app.state.limiter = limiter

# ── Middleware ────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# ── Static file serving ──────────────────────────────────────────────────────

UPLOAD_DIR = settings.upload_dir
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ── Error handlers ───────────────────────────────────────────────────────────

register_error_handlers(app)

# ── Routes ───────────────────────────────────────────────────────────────────

# Backward-compat old route paths
app.include_router(auth_router.router)
app.include_router(detection_router.router)
app.include_router(education_router.router)
app.include_router(blacklist_router.router)
app.include_router(evidence_router.router)

# New v1 router (registered BEFORE legacy tickets_router so /export beats /{ticket_id})
app.include_router(v1_router)
app.include_router(tickets_router.router)
