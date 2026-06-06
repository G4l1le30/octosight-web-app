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
            "embedding":          "TEXT",
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

    pending_tables = {
        "achievements": """
            CREATE TABLE IF NOT EXISTS achievements (
                id VARCHAR(36) PRIMARY KEY,
                code VARCHAR(50) NOT NULL UNIQUE,
                name VARCHAR(100) NOT NULL,
                description VARCHAR(500),
                icon_url VARCHAR(255),
                criteria_type VARCHAR(50),
                criteria_value INTEGER DEFAULT 0,
                points INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_achievement_code (code)
            )
        """,
        "user_achievements": """
            CREATE TABLE IF NOT EXISTS user_achievements (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                achievement_id VARCHAR(36) NOT NULL,
                earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
                UNIQUE KEY uq_user_achievement (user_id, achievement_id)
            )
        """,
        "user_gamification": """
            CREATE TABLE IF NOT EXISTS user_gamification (
                user_id VARCHAR(36) PRIMARY KEY,
                total_points INTEGER DEFAULT 0,
                current_streak INTEGER DEFAULT 0,
                longest_streak INTEGER DEFAULT 0,
                last_activity_date DATE,
                level INTEGER DEFAULT 1,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """,
    }

    import re
    def is_safe_identifier(name: str) -> bool:
        return bool(re.match(r"^[a-zA-Z0-9_]+$", name))

    for table, ddl in pending_tables.items():
        if not is_safe_identifier(table):
            print(f"[Migration] Skipping unsafe table name: {table}")
            continue
        try:
            db.execute(text(ddl))
            db.commit()
            print(f"[Migration] Created table '{table}'")
        except Exception:
            db.rollback()

    for table, columns in pending_columns.items():
        if not is_safe_identifier(table):
            print(f"[Migration] Skipping unsafe table name: {table}")
            continue
        for col, col_type in columns.items():
            if not is_safe_identifier(col):
                print(f"[Migration] Skipping unsafe column name: {col}")
                continue
            try:
                # Still using f-string for DDL as DDL doesn't support bind params in most DBs,
                # but now with strict alphanumeric validation.
                db.execute(
                    text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}")
                )
                db.commit()
                print(f"[Migration] Added column '{table}.{col}'")
            except Exception:
                db.rollback()  # column already exists — skip silently
