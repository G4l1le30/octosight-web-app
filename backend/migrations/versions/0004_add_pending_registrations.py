"""add pending_registrations table for secure email verification

Revision ID: 0004
Revises: 0003
Create Date: 2026-05-30 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    try:
        op.create_table(
            "pending_registrations",
            sa.Column("id", sa.String(36), nullable=False),
            sa.Column("email", sa.String(255), nullable=False),
            sa.Column("full_name", sa.String(255), nullable=False),
            sa.Column("hashed_password", sa.String(255), nullable=False),
            sa.Column("token_hash", sa.String(64), nullable=False),
            sa.Column("token_expires_at", sa.DateTime(), nullable=False),
            sa.Column("attempts", sa.Integer(), default=0),
            sa.Column("is_verified", sa.Boolean(), default=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_pending_email", "pending_registrations", ["email"])
        op.create_index("ix_pending_token_hash", "pending_registrations", ["token_hash"])
    except Exception:
        pass


def downgrade() -> None:
    op.drop_table("pending_registrations")
