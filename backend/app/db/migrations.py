"""
migrations.py — Schema migration and Alembic helpers.
"""

from pathlib import Path

from alembic.config import Config
from alembic import command as alembic_command
from sqlalchemy.orm import Session
from sqlalchemy import text

ALEMBIC_CFG_PATH = Path(__file__).resolve().parents[2] / "alembic.ini"


def run_alembic_migrations() -> None:
    """
    Run all pending Alembic migrations programmatically at startup.
    This handles migrations created via `alembic revision --autogenerate`.
    """
    cfg = Config(str(ALEMBIC_CFG_PATH))
    alembic_command.upgrade(cfg, "head")


def apply_migrations(db: Session) -> None:
    """
    Legacy: idempotently add any missing columns via raw ALTER TABLE.

    Serves as a fallback for databases created before Alembic existed.
    """
    pending_columns = {
        "tickets": {
            "sender_numbers":     "TEXT",
            "extracted_text":     "TEXT",
            "attachment_paths":   "VARCHAR(1000)",
            "screenshot_paths":   "VARCHAR(1000)",
            "investigation_notes":"TEXT",
            "rule_score":         "FLOAT",
            "ml_score":           "FLOAT",
            "updated_at":         "DATETIME",
            "education_recommendation": "JSON",
            "bank_name":          "VARCHAR(100)",
            "bank_account":       "VARCHAR(50)",
            "reference_number":   "VARCHAR(100)",
        },
        "users": {
            "updated_at": "DATETIME",
            "failed_login_attempts": "INTEGER DEFAULT 0",
            "locked_until": "DATETIME",
        },
        "mock_bank_transactions": {
            "sender_account":     "VARCHAR(50)",
            "receiver_account":   "VARCHAR(50)",
            "sender_bank":        "VARCHAR(100)",
            "receiver_bank":      "VARCHAR(100)",
        },
    }

    for table, columns in pending_columns.items():
        for col, col_type in columns.items():
            try:
                db.execute(
                    text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}")
                )
                db.commit()
                print(f"[Migration] Added column '{table}.{col}'")
            except Exception:
                db.rollback()  # column already exists — skip silently
