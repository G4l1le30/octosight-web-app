"""
main.py — OctoSight FastAPI application entry point.

Uses the refactored architecture:
- config.py for all env vars
- core/error_handlers.py for exception registration
- api/v1/ for new versioned endpoints
- Existing api/endpoints/ for backward compat (migration in progress)
"""

import os
import sys
import time
import uuid
import logging
from datetime import datetime, timedelta, timezone
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from app.config import settings

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    stream=sys.stdout,
)
logger = logging.getLogger("octosight")

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
    ActivityLog,
    Achievement,
    UserAchievement,
    UserGamification,
)

from app.core.security import hash_password, limiter
from app.core.error_handlers import register_error_handlers
from slowapi.middleware import SlowAPIMiddleware

# Optional Sentry SDK
SENTRY_DSN = os.getenv("SENTRY_DSN", "")
if SENTRY_DSN:
    try:
        import sentry_sdk
        sentry_sdk.init(
            dsn=SENTRY_DSN,
            environment=settings.environment,
            traces_sample_rate=0.1,
        )
        logger.info("Sentry SDK initialized (env=%s)", settings.environment)
    except Exception as exc:
        logger.warning("Sentry SDK init failed: %s", exc)
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
            from email_validator import validate_email
            admin_email = validate_email(admin_email, check_deliverability=False).normalized.lower()
        except Exception as exc:
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

    user_email = (settings.default_user_email or "").strip()
    user_password = settings.default_user_password

    if user_email:
        try:
            from email_validator import validate_email
            user_email = validate_email(user_email, check_deliverability=False).normalized.lower()
        except Exception as exc:
            print(f"[Seed] Skipping user — DEFAULT_USER_EMAIL invalid: {exc}")
            user_email = ""

    if user_email and user_password and not db.query(User).filter(User.email == user_email).first():
        db.add(
            User(
                id=str(uuid.uuid4()),
                full_name="OctoSight User",
                email=user_email,
                hashed_password=hash_password(user_password),
                role="user",
            )
        )
        db.commit()
        print(f"[Seed] User created: {user_email}")

    # Role-based team users (octosight.{role}@gmail.com)
    default_pw = settings.default_admin_password or "octosight123"
    role_users = [
        ("Administrator OctoSight", "octosight.admin@gmail.com", "admin"),
        ("Moderator OctoSight", "octosight.moderator@gmail.com", "moderator"),
        ("Investigator OctoSight", "octosight.investigator@gmail.com", "investigator"),
        ("Analyst OctoSight", "octosight.analyst@gmail.com", "analyst"),
        ("CS OctoSight", "octosight.cs@gmail.com", "cs"),
        ("Viewer OctoSight", "octosight.viewer@gmail.com", "viewer"),
        ("User OctoSight", "octosight.user@gmail.com", "user"),
    ]
    uids = {}
    user_emails = {}
    for full_name, email, role in role_users:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            uids[role] = existing.id
            user_emails[role] = existing.email
            continue
        uid = str(uuid.uuid4())
        uids[role] = uid
        user_emails[role] = email
        db.add(User(
            id=uid, full_name=full_name, email=email,
            hashed_password=hash_password(default_pw), role=role,
        ))
    db.commit()
    admin_user = db.query(User).filter(User.email == admin_email).first()
    if admin_user:
        uids["admin"] = admin_user.id
        user_emails["admin"] = admin_user.email
    print(f"[Seed] {len(role_users)} team users created ({', '.join(e[2] for e in role_users)})")

    # Dummy tickets
    if db.query(Ticket).count() == 0:
        now = datetime.now(timezone.utc)
        dummy = [
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

        # Distribute dates across last 14 days
        all_tickets = db.query(Ticket).order_by(Ticket.ticket_id).all()
        date_offsets = [
            (14, 3, 22), (13, 8, 15), (12, 11, 45), (11, 2, 30),
            (10, 7, 10), (9, 4, 55), (8, 9, 20), (7, 1, 40),
            (6, 6, 35), (5, 10, 5), (4, 3, 50), (3, 8, 25),
            (2, 5, 0), (1, 7, 30), (0, 2, 15),
        ]
        analyst_emails = [user_emails.get(r) for r in ["analyst", "investigator", "moderator"] if user_emails.get(r)]
        for i, t in enumerate(all_tickets):
            d, h, m = date_offsets[i % len(date_offsets)]
            t.created_at = now - timedelta(days=d, hours=h, minutes=m)
            if analyst_emails and t.status not in ("Closed", "False Positive", "Mitigated"):
                t.assigned_to = analyst_emails[i % len(analyst_emails)]
        db.commit()
        print(f"[Seed] {len(dummy)} dummy tickets created, {len(all_tickets)} assigned")

    # Mock bank transactions (50+ realistic)
    existing_count = db.query(MockBankTransaction).count()
    if existing_count < 60:
        db.query(MockBankTransaction).delete()
        base_dt = datetime.now(timezone.utc) - timedelta(days=60)
        mock_txs = []
        tx_templates = [
            # (ref_suffix, sender, s_acct, s_bank, r_acct, r_bank, amount, tx_type, status, desc, merchant, location, flagged, flag_reason, anomaly_score, day_offset)
            (1, "Budi CIMB User", "706123456789", "CIMB NIAGA", "704987654321", "CIMB NIAGA", 500000.0, "TRANSFER", "COMPLETED", "Transfer bulanan", None, None, False, None, 0.0, 0),
            (2, "Siti Niaga", "701234555111", "CIMB NIAGA", "704987654321", "CIMB NIAGA", 1250000.0, "TRANSFER", "COMPLETED", "Pembayaran tagihan", None, None, False, None, 0.0, 1),
            (3, "Dedi Oktoman", "705556667770", "CIMB NIAGA", "704987654321", "CIMB NIAGA", 200000.0, "TRANSFER", "COMPLETED", "Biaya admin", None, None, False, None, 0.0, 2),
            (4, "Ahmad Fauzi", "708111222333", "CIMB NIAGA", "712345678901", "BCA", 75000.0, "TRANSFER", "COMPLETED", "Bayar kos", None, None, False, None, 0.0, 3),
            (5, "Rina Wijaya", "702345678901", "CIMB NIAGA", "708888777666", "MANDIRI", 250000.0, "TRANSFER", "COMPLETED", "Pembayaran asuransi", None, None, False, None, 0.0, 4),
            (6, "Doni Prasetyo", "704444555666", "CIMB NIAGA", "709999888777", "BNI", 50000.0, "TRANSFER", "COMPLETED", "Top up e-wallet", None, None, False, None, 0.0, 5),
            (7, "Mega Sari", "703333222111", "CIMB NIAGA", "710000111222", "BRI", 150000.0, "TRANSFER", "COMPLETED", "Pembayaran BPJS", None, None, False, None, 0.0, 6),
            (8, "Bayu Segara", "707777888999", "CIMB NIAGA", "711111222333", "CIMB NIAGA", 10000000.0, "TRANSFER", "COMPLETED", "DP rumah", None, None, False, None, 0.0, 7),
            (9, "Citra Lestari", "709999000111", "CIMB NIAGA", "700001111222", "CIMB NIAGA", 350000.0, "TRANSFER", "COMPLETED", "Biaya kuliah", None, None, False, None, 0.0, 8),
            (10, "Eko Saputra", "701111222333", "CIMB NIAGA", "713333444555", "CIMB NIAGA", 175000.0, "TRANSFER", "COMPLETED", "Bayar listrik", None, None, False, None, 0.0, 9),
            (11, "Budi CIMB User", "706123456789", "CIMB NIAGA", None, None, 5000000.0, "CREDIT", "COMPLETED", "Gaji bulanan", "PT. Maju Bersama", "Jakarta", False, None, 0.0, 10),
            (12, "Siti Niaga", "701234555111", "CIMB NIAGA", None, None, 7500000.0, "CREDIT", "COMPLETED", "Gaji bulanan", "PT. Sejahtera Abadi", "Bandung", False, None, 0.0, 11),
            (13, "Ahmad Fauzi", "708111222333", "CIMB NIAGA", None, None, 4200000.0, "CREDIT", "COMPLETED", "Gaji bulanan", "PT. Karya Mandiri", "Surabaya", False, None, 0.0, 12),
            (14, "Rina Wijaya", "702345678901", "CIMB NIAGA", None, None, 6800000.0, "CREDIT", "COMPLETED", "Gaji bulanan", "PT. Sukses Selalu", "Jakarta", False, None, 0.0, 13),
            (15, "Doni Prasetyo", "704444555666", "CIMB NIAGA", None, None, 150000.0, "CREDIT", "COMPLETED", "Bonus tahunan", "PT. Maju Bersama", "Semarang", False, None, 0.0, 14),
            (16, "Mega Sari", "703333222111", "CIMB NIAGA", "712345000111", "TOKOPEDIA", 250000.0, "DEBIT", "COMPLETED", "Belanja bulanan", "Tokopedia", "Online", False, None, 0.0, 15),
            (17, "Bayu Segara", "707777888999", "CIMB NIAGA", "712345000222", "SHOPEE", 450000.0, "DEBIT", "COMPLETED", "Belanja elektronik", "Shopee", "Online", False, None, 0.0, 16),
            (18, "Citra Lestari", "709999000111", "CIMB NIAGA", "712345000333", "TRAVELOKA", 1200000.0, "DEBIT", "COMPLETED", "Tiket pesawat", "Traveloka", "Online", False, None, 0.0, 17),
            (19, "Eko Saputra", "701111222333", "CIMB NIAGA", "712345000444", "GRAB", 35000.0, "DEBIT", "COMPLETED", "GoFood", "Grab", "Online", False, None, 0.0, 18),
            (20, "Budi CIMB User", "706123456789", "CIMB NIAGA", "712345000555", "GOOGLE", 150000.0, "DEBIT", "COMPLETED", "Google One subscription", "Google", "Online", False, None, 0.0, 19),
            (21, "Budi CIMB User", "706123456789", "CIMB NIAGA", "712345000666", "NETFLIX", 186000.0, "DEBIT", "COMPLETED", "Netflix subscription", "Netflix", "Online", False, None, 0.0, 20),
            (22, "Siti Niaga", "701234555111", "CIMB NIAGA", "712345000777", "SPOTIFY", 59000.0, "DEBIT", "COMPLETED", "Spotify Premium", "Spotify", "Online", False, None, 0.0, 21),
            (23, "Budi CIMB User", "706123456789", "CIMB NIAGA", "712345000888", "ALFAMART", 75000.0, "DEBIT", "COMPLETED", "Belanja kebutuhan", "Alfamart", "Jakarta Selatan", False, None, 0.0, 22),
            (24, "Siti Niaga", "701234555111", "CIMB NIAGA", "712345000999", "STARBUCKS", 65000.0, "DEBIT", "COMPLETED", "Kopi pagi", "Starbucks", "Jakarta Pusat", False, None, 0.0, 23),
            (25, "Dedi Oktoman", "705556667770", "CIMB NIAGA", "712345001000", "PERTAMINA", 500000.0, "DEBIT", "COMPLETED", "Isi bensin", "Pertamina", "Jakarta Timur", False, None, 0.0, 24),
            (26, "Unknown", "700000000001", "BCA", "704987654321", "CIMB NIAGA", 25000000.0, "TRANSFER", "FLAGGED", "Transfer mencurigakan dari rekening tidak dikenal", None, None, True, "Large transfer from unknown sender outside CIMB", 85.0, 25),
            (27, "Budi CIMB User", "706123456789", "CIMB NIAGA", "704987654321", "CIMB NIAGA", 500000.0, "TRANSFER", "COMPLETED", "Transfer rutin", None, None, False, None, 0.0, 26),
            (28, "Scammer Account", "777888999000", "BANK BANTU", "706123456789", "CIMB NIAGA", 10000000.0, "TRANSFER", "FLAGGED", "Transfer dari bank lain — potensi penipuan", None, None, True, "Sender account blacklisted in fraud database", 92.0, 27),
            (29, "Budi CIMB User", "706123456789", "CIMB NIAGA", "777888999000", "BANK BANTU", 5000000.0, "TRANSFER", "FLAGGED", "Transfer ke rekening yang dilaporkan fraud", None, None, True, "Recipient account flagged in recent ticket report", 78.0, 28),
            (30, "Ahmad Fauzi", "708111222333", "CIMB NIAGA", "712345001111", "CIMB NIAGA", 3000000.0, "TRANSFER", "COMPLETED", "Pembayaran kontrakan 3 bulan", None, None, False, None, 0.0, 29),
            (31, "Rina Wijaya", "702345678901", "CIMB NIAGA", "712345001222", "CIMB NIAGA", 25000000.0, "TRANSFER", "COMPLETED", "Jual mobil", None, None, False, None, 0.0, 30),
            (32, "Doni Prasetyo", "704444555666", "CIMB NIAGA", "712345001333", "CIMB NIAGA", 500000.0, "TRANSFER", "PENDING", "Transfer dalam proses — menunggu konfirmasi", None, None, False, None, 0.0, 31),
            (33, "Mega Sari", "703333222111", "CIMB NIAGA", "712345001444", "CIMB NIAGA", 10000000.0, "TRANSFER", "PENDING", "Transfer dana besar — pending review", None, None, False, None, 0.0, 32),
            (34, "Unknown", "700000000002", "MANDIRI", "706123456789", "CIMB NIAGA", 50000000.0, "TRANSFER", "FLAGGED", "Transfer dana besar mencurigakan tengah malam", None, None, True, "Midnight transfer of unusually large amount", 95.0, 33),
            (35, "Budi CIMB User", "706123456789", "CIMB NIAGA", "712345001555", "BCA", 100000.0, "TRANSFER", "COMPLETED", "Pembayaran iuran", None, None, False, None, 0.0, 34),
            (36, "Siti Niaga", "701234555111", "CIMB NIAGA", None, None, 7500000.0, "CREDIT", "COMPLETED", "Gaji bulanan", "PT. Sejahtera Abadi", "Bandung", False, None, 0.0, 35),
            (37, "Budi CIMB User", "706123456789", "CIMB NIAGA", None, None, 5000000.0, "CREDIT", "COMPLETED", "Gaji bulanan", "PT. Maju Bersama", "Jakarta", False, None, 0.0, 36),
            (38, "Citra Lestari", "709999000111", "CIMB NIAGA", "712345001666", "SHOPEE", 75000.0, "DEBIT", "COMPLETED", "Belanja fashion", "Shopee", "Online", False, None, 0.0, 37),
            (39, "Eko Saputra", "701111222333", "CIMB NIAGA", "712345001777", "GRAB", 25000.0, "DEBIT", "COMPLETED", "GoRide", "Grab", "Online", False, None, 0.0, 38),
            (40, "Dedi Oktoman", "705556667770", "CIMB NIAGA", "712345001888", "PERTAMINA", 350000.0, "DEBIT", "COMPLETED", "Isi bensin", "Pertamina", "Jakarta Barat", False, None, 0.0, 39),
            (41, "Budi CIMB User", "706123456789", "CIMB NIAGA", "712345001999", "ALFAMART", 120000.0, "DEBIT", "COMPLETED", "Belanja mingguan", "Alfamart", "Jakarta Selatan", False, None, 0.0, 40),
            (42, "Budi CIMB User", "706123456789", "CIMB NIAGA", "712345002000", "CIMB NIAGA", 15000000.0, "TRANSFER", "COMPLETED", "Deposito", None, None, False, None, 0.0, 41),
            (43, "Budi CIMB User", "706123456789", "CIMB NIAGA", "712345002111", "CIMB NIAGA", 200000.0, "TRANSFER", "COMPLETED", "Pembayaran kartu kredit", None, None, False, None, 0.0, 42),
            (44, "Siti Niaga", "701234555111", "CIMB NIAGA", "712345002222", "CIMB NIAGA", 5000000.0, "TRANSFER", "COMPLETED", "Pinjaman keluarga", None, None, False, None, 0.0, 43),
            (45, "Ahmad Fauzi", "708111222333", "CIMB NIAGA", "712345002333", "CIMB NIAGA", 7500000.0, "TRANSFER", "COMPLETED", "Pembelian motor", None, None, False, None, 0.0, 44),
            (46, "Rina Wijaya", "702345678901", "CIMB NIAGA", "712345002444", "CIMB NIAGA", 400000.0, "TRANSFER", "COMPLETED", "Pembayaran dokter", None, None, False, None, 0.0, 45),
            (47, "Doni Prasetyo", "704444555666", "CIMB NIAGA", "712345002555", "CIMB NIAGA", 50000000.0, "TRANSFER", "PENDING", "Transaksi besar menunggu review", None, None, True, "Amount exceeds threshold for automatic processing", 65.0, 46),
            (48, "Mega Sari", "703333222111", "CIMB NIAGA", "712345002666", "CIMB NIAGA", 3000000.0, "TRANSFER", "COMPLETED", "Biaya renovasi rumah", None, None, False, None, 0.0, 47),
            (49, "Bayu Segara", "707777888999", "CIMB NIAGA", "712345002777", "CIMB NIAGA", 2500000.0, "TRANSFER", "COMPLETED", "Pembayaran kontrakan", None, None, False, None, 0.0, 48),
            (50, "Scammer Account", "777888999111", "BANK BANTU", "701234555111", "CIMB NIAGA", 5000000.0, "TRANSFER", "REVERSED", "Transaksi fraud — sudah direversal", None, None, True, "Confirmed fraud — reversed by admin", 100.0, 49),
            (51, "Siti Niaga", "701234555111", "CIMB NIAGA", "712345002888", "CIMB NIAGA", 1500000.0, "TRANSFER", "COMPLETED", "Investasi reksadana", None, None, False, None, 0.0, 50),
            (52, "Citra Lestari", "709999000111", "CIMB NIAGA", "712345002999", "GOOGLE", 350000.0, "DEBIT", "COMPLETED", "Google Ads payment", "Google", "Online", False, None, 0.0, 51),
            (53, "Eko Saputra", "701111222333", "CIMB NIAGA", "712345003000", "NETFLIX", 186000.0, "DEBIT", "COMPLETED", "Netflix subscription", "Netflix", "Online", False, None, 0.0, 52),
            (54, "Budi CIMB User", "706123456789", "CIMB NIAGA", "712345003111", "TOKOPEDIA", 175000.0, "DEBIT", "COMPLETED", "Belanja perlengkapan rumah", "Tokopedia", "Online", False, None, 0.0, 53),
            (55, "Budi CIMB User", "706123456789", "CIMB NIAGA", "712345003222", "CIMB NIAGA", 1000000.0, "TRANSFER", "COMPLETED", "Tabungan pendidikan", None, None, False, None, 0.0, 54),
            (56, "Siti Niaga", "701234555111", "CIMB NIAGA", None, None, 7500000.0, "CREDIT", "COMPLETED", "Gaji bulanan", "PT. Sejahtera Abadi", "Bandung", False, None, 0.0, 55),
            (57, "Dedi Oktoman", "705556667770", "CIMB NIAGA", None, None, 350000.0, "CREDIT", "COMPLETED", "Hasil jualan online", "Shopee", "Online", False, None, 0.0, 56),
            (58, "Budi CIMB User", "706123456789", "CIMB NIAGA", "712345003333", "CIMB NIAGA", 5000000.0, "TRANSFER", "COMPLETED", "Mutasi antar rekening", None, None, False, None, 0.0, 57),
            (59, "Budi CIMB User", "706123456789", "CIMB NIAGA", "712345003444", "CIMB NIAGA", 250000.0, "TRANSFER", "COMPLETED", "Donasi", None, None, False, None, 0.0, 58),
            (60, "Ahmad Fauzi", "708111222333", "CIMB NIAGA", "712345003555", "CIMB NIAGA", 100000.0, "TRANSFER", "COMPLETED", "Bayar arisan", None, None, False, None, 0.0, 59),
        ]
        for t in tx_templates:
            dt = base_dt + timedelta(days=t[15])
            mock_txs.append(MockBankTransaction(
                reference_number=f"OCTO-REF-{t[0]:03d}",
                sender_name=t[1],
                sender_account=t[2],
                sender_bank=t[3],
                receiver_account=t[4],
                receiver_bank=t[5],
                amount=t[6],
                transaction_type=t[7],
                status=t[8],
                description=t[9],
                merchant_name=t[10],
                location=t[11],
                is_flagged=t[12],
                flag_reason=t[13],
                anomaly_score=t[14],
                transaction_date=dt,
                created_at=dt,
                updated_at=dt,
            ))
        db.add_all(mock_txs)
        db.commit()
        flagged = sum(1 for t in mock_txs if t.is_flagged)
        print(f"[Seed] {len(mock_txs)} mock CIMB transactions created ({flagged} flagged)")

    # Blacklisted URLs
    if db.query(BlacklistedURL).count() < 10:
        try:
            db.query(BlacklistedURL).delete()
            from urllib.parse import urlparse
            url_data = [
                ("https://clmbniaga-bonus.tk/claim", "Typosquat domain CIMB Niaga"),
                ("https://cimb-niaga-verif.net/login", "Fake CIMB login page"),
                ("https://security-cimb.xyz/blocked", "Fake security alert page"),
                ("https://secure-cimb-login.com/auth", "Lookalike CIMB login form"),
                ("https://cimb-update.info/verify", "Non-official CIMB verification page"),
                ("https://promo-cimbniaga.com/reward", "Fake reward claiming page"),
                ("https://cimbniaga-secure.id/login", "Punycode CIMB mimic domain"),
                ("https://bit.ly/fake-cimb", "Shortened URL to phishing page"),
                ("https://cimb-prize.xyz/claim", "Fake prize phishing page"),
                ("https://octosight-verify.tk/login", "OctoSight impersonation page"),
                ("https://secure-login-cimb.com/auth", "Credential harvesting page"),
                ("https://cimb-niaga-promo.top/reward", "Fake CIMB promo page"),
            ]
            db.add_all([
                BlacklistedURL(url=url, domain=urlparse(url).netloc, reason=reason)
                for url, reason in url_data
            ])
            db.commit()
            print(f"[Seed] {len(url_data)} blacklisted URLs created")
        except Exception as e:
            db.rollback()
            print(f"[Seed] blacklisted URLs skipped ({e})")

    # Blacklisted accounts (10+)
    if db.query(BlacklistedAccount).count() < 10:
        try:
            db.query(BlacklistedAccount).delete()
            acct_data = [
                ("1234567890", "OCTO Virtual", "Penipuan modus salah kirim"),
                ("081234567890", "E-Wallet Scam", "Dompet digital penipu barang fiktif"),
                ("777888999000", "Bank Bantu", "Rekening penampung fraud"),
                ("777888999111", "Bank Bantu", "Rekening fraud direversal"),
                ("700000000001", "BCA", "Transfer mencurigakan dari unknown sender"),
                ("700000000002", "Mandiri", "Transfer dana besar tengah malam"),
                ("888000111222", "Bank Sejahtera", "Rekening terafiliasi judi online"),
                ("888000333444", "Bank Digital", "Penampung dana penipuan investasi bodong"),
                ("888000555666", "Bank Raya", "Rekening penjual barang tidak dikirim"),
                ("888000777888", "Bank Cepat", "Rekening pinjaman online ilegal"),
                ("888000999000", "Bank Santosa", "Penampung dana phishing SMS"),
                ("888001111222", "Bank Mitra", "Rekening penipuan social engineering"),
            ]
            db.add_all([BlacklistedAccount(account_number=a, bank_name=b, reason=c) for a, b, c in acct_data])
            db.commit()
            print(f"[Seed] {len(acct_data)} blacklisted accounts created")
        except Exception as e:
            db.rollback()
            print(f"[Seed] blacklisted accounts skipped ({e})")

    # Blacklisted phones (10+)
    if db.query(BlacklistedPhone).count() < 10:
        try:
            db.query(BlacklistedPhone).delete()
            phone_data = [
                ("08968554576", "Spam penipuan anak kecelakaan"),
                ("08123456789", "SMS phishing hadiah palsu"),
                ("+6281234567890", "SMS akun dibekukan — minta klik link"),
                ("+6285678901234", "WhatsApp hadiah CIMB palsu"),
                ("+6289876543210", "SMS refund pajak dengan link singkat"),
                ("+6281122334455", "WhatsApp promo CIMB mencurigakan"),
                ("+6287766554433", "SMS transaksi tidak sah — minta hubungi nomor"),
                ("+6283344556677", "Email invoice palsu dari unknown sender"),
                ("+6284455667788", "WhatsApp update keamanan akun mendesak"),
                ("+6289988776655", "Telepon impersonasi CS CIMB minta OTP"),
                ("+6288877665544", "SMS undian berhadiah mengatasnamakan CIMB"),
                ("+6289988776644", "WhatsApp penipuan lowongan pekerjaan"),
            ]
            db.add_all([BlacklistedPhone(phone_number=p, reason=r) for p, r in phone_data])
            db.commit()
            print(f"[Seed] {len(phone_data)} blacklisted phones created")
        except Exception as e:
            db.rollback()
            print(f"[Seed] blacklisted phones skipped ({e})")

    # Blacklisted emails (10+)
    if db.query(BlacklistedEmail).count() < 10:
        try:
            db.query(BlacklistedEmail).delete()
            email_data = [
                ("scammer@urgent-cimb.com", "Email impersonasi CIMB NIAGA"),
                ("admin@secure-payment.xyz", "Email phishing payment gateway"),
                ("security@cimb-niaga-verify.com", "Email fake security alert CIMB"),
                ("support@cimb-update.info", "Email verification account palsu"),
                ("noreply@promo-cimbniaga.com", "Email promo reward mengatasnamakan CIMB"),
                ("billing@cimb-invoice.com", "Email fake invoice attachment"),
                ("cs@cimb-prize.xyz", "Email hadiah undian palsu"),
                ("verification@cimb-secure.id", "Email verifikasi akun phishing"),
                ("admin@octosight-verify.tk", "Email impersonasi OctoSight"),
                ("support@secure-login-cimb.com", "Email credential harvesting"),
                ("noreply@cimb-niaga-promo.top", "Email promo CIMB penipuan"),
                ("info@bank-bantu.xyz", "Email transfer konfirmasi fraud"),
            ]
            db.add_all([BlacklistedEmail(email=e, reason=r) for e, r in email_data])
            db.commit()
            print(f"[Seed] {len(email_data)} blacklisted emails created")
        except Exception as e:
            db.rollback()
            print(f"[Seed] blacklisted emails skipped ({e})")

    # Rule config defaults
    RuleConfigService.seed_default_rules(db)

    # ── Permissions & role mappings ────────────────────────────────────────────
    if db.query(Permission).count() == 0:
        perm_defs = {
            # dashboard
            "dashboard.view": "View main dashboard",

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
            "ml.submit_feedback": "Submit feedback on ML predictions",
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

    # ── Achievement seeds ────────────────────────────────────────────────
    if db.query(Achievement).count() == 0:
        achievement_defs = [
            ("first_report", "First Report", "Submit your first ticket", "count", 1, 50),
            ("reporter_5", "Reporter x5", "Submit 5 tickets", "count", 5, 100),
            ("reporter_10", "Reporter x10", "Submit 10 tickets", "count", 10, 200),
            ("feedback_master", "Feedback Master", "Submit 10 feedbacks", "count", 10, 150),
            ("accurate_eye", "Accurate Eye", "5 correct TP/FP labels", "count", 5, 150),
            ("streak_3", "Streak 3", "3-day login streak", "streak", 3, 30),
            ("streak_7", "Streak 7", "7-day login streak", "streak", 7, 100),
            ("scholar", "Scholar", "Complete all education modules", "module", 0, 200),
            ("phishing_hunter", "Phishing Hunter", "5 confirmed tickets", "count", 5, 250),
            ("guardian", "Guardian", "20 total confirmed tickets", "count", 20, 500),
            ("first_module", "First Step", "Complete your first education module", "module", 1, 50),
            ("half_modules", "Halfway Scholar", "Complete 50% of education modules", "module", 4, 100),
            ("quiz_ace", "Quiz Ace", "Score 100% on any quiz", "quiz", 100, 150),
            ("bookworm", "Bookworm", "Read 10 articles", "count", 10, 100),
        ]
        for code, name, desc, crit_type, crit_val, pts in achievement_defs:
            db.add(Achievement(
                code=code, name=name, description=desc,
                criteria_type=crit_type, criteria_value=crit_val, points=pts,
            ))
        db.commit()
        print(f"[Seed] {len(achievement_defs)} achievements created")

    # ── Activity Log seeds ───────────────────────────────────────────────
    if db.query(ActivityLog).count() == 0:
        try:
            admin_id = str(uuid.uuid4())
            admin_user = db.query(User).filter(User.role == "admin").first()
            if admin_user:
                admin_id = admin_user.id
            all_tickets_act = db.query(Ticket).order_by(Ticket.created_at).all()
            now_act = datetime.now(timezone.utc)
            activities = []
            act_templates = [
                "New phishing report submitted: {summary}",
                "Ticket updated — status changed to {status}",
                "Blacklist entry added for domain {url}",
                "ML analysis completed for ticket {ticket_id}",
            ]
            for i, t in enumerate(all_tickets_act):
                t_created = t.created_at or (now_act - timedelta(days=14))
                activities.append(ActivityLog(
                    activity_type="ticket_created",
                    description=act_templates[0].format(summary=(t.summary or "No summary")[:80]),
                    actor_id=admin_id,
                    ticket_id=t.ticket_id,
                    created_at=t_created,
                ))
                if i % 3 == 0:
                    updated_at = t_created + timedelta(hours=2 + i)
                    activities.append(ActivityLog(
                        activity_type="ticket_updated",
                        description=act_templates[1].format(status=t.status or "In Review"),
                        actor_id=admin_id,
                        ticket_id=t.ticket_id,
                        created_at=updated_at,
                    ))
                if i % 4 == 0 and t.url:
                    bl_at = t_created + timedelta(hours=4 + i)
                    activities.append(ActivityLog(
                        activity_type="blacklist_added",
                        description=act_templates[2].format(url=t.url[:60]),
                        actor_id=admin_id,
                        ticket_id=t.ticket_id,
                        created_at=bl_at,
                    ))
            db.add_all(activities)
            db.commit()
            print(f"[Seed] {len(activities)} activity log entries created")
        except Exception as e:
            db.rollback()
            print(f"[Seed] activity logs skipped ({e})")

    # ── Lifespan ────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Wait for DB, create schema, migrate, seed."""
    retries = 10
    while retries > 0:
        try:
            Base.metadata.create_all(bind=engine)
            run_alembic_migrations()
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
            
            # ── External Service Health Checks ──
            
            # 1. Email Service Check
            from app.modules.notifications.service import fast_mail, _mail_enabled
            if _mail_enabled and fast_mail:
                # We do this in a background-like way or non-blocking to log info
                logger.info("[Startup] SMTP configured: %s:%d (STARTTLS: %s, SSL: %s)", 
                            settings.mail_server, settings.mail_port, 
                            settings.mail_starttls, settings.mail_ssl_tls)
                # Note: Testing connection usually requires an awaitable, 
                # but we are in a synchronous part of lifespan for simplicity 
                # so we just log the status. For a real ping, we'd need to run 
                # it in the event loop.
                logger.info("[Startup] Mail check: MAIL_USERNAME=%s", settings.mail_username)

            # 2. Redis Check
            try:
                from app.core.redis_client import RedisClient
                r_client = RedisClient()
                if settings.redis_url:
                    if r_client.ping():
                        print("[Startup] Redis connection successful.")
                    else:
                        print(f"[Startup] Redis check failed (URL: {settings.redis_url})")
                else:
                    print("[Startup] Redis: Using in-memory fallback (no REDIS_URL).")
            except Exception as e:
                print(f"[Startup] Redis health check encountered an error: {e}")

            # 3. VirusTotal Check
            if settings.virustotal_api_key:
                print("[Startup] VirusTotal API Key configured. Ready for scanning.")
            else:
                print("[Startup] VirusTotal API Key NOT configured. File scanning will be skipped.")

            print("[Startup] Database and services ready.")
            break
        except Exception as exc:
            retries -= 1
            logger.warning("DB not ready, retrying... (%s left) — %s", retries, exc)
            time.sleep(5)

    if retries == 0:
        logger.error("Could not connect to database after 10 retries.")

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

# Register global error handlers
register_error_handlers(app)

app.state.limiter = limiter

# ── Middleware ────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
)

app.add_middleware(SlowAPIMiddleware)


@app.middleware("http")
async def metrics_and_security(request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start

    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

    # Basic request metrics logging
    status_code = response.status_code
    if status_code >= 500:
        logger.error("Request: %s %s -> %d (%.3fs)", request.method, request.url.path, status_code, duration)
    elif status_code >= 400:
        logger.warning("Request: %s %s -> %d (%.3fs)", request.method, request.url.path, status_code, duration)
    else:
        logger.debug("Request: %s %s -> %d (%.3fs)", request.method, request.url.path, status_code, duration)
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
