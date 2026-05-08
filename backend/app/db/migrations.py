"""
migrations.py — Lightweight schema migration helpers.

These are applied at startup to add columns that may be missing from
databases created before Alembic migrations were introduced.
"""

from sqlalchemy.orm import Session
from sqlalchemy import text


def apply_migrations(db: Session) -> None:
    """
    Idempotently add any missing columns to existing tables.

    Each ALTER TABLE is wrapped in a try/except so it is silently skipped
    when the column already exists (MySQL raises 1060 on duplicate column).
    """
    pending_columns = {
        "tickets": {
            "sender_numbers":     "TEXT",
            "extracted_text":     "TEXT",
            "attachment_names":   "VARCHAR(500)",
            "attachment_paths":   "VARCHAR(1000)",
            "screenshot_paths":   "VARCHAR(1000)",
            "investigation_notes":"TEXT",
            "rule_score":         "FLOAT",
            "ml_score":           "FLOAT",
            "updated_at":         "DATETIME",
        },
        "users": {
            "updated_at": "DATETIME",
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
