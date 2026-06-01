"""add is_active column to users table

Revision ID: 0006
Revises: 0005
Create Date: 2026-06-01 12:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    try:
        op.add_column("users", sa.Column("is_active", sa.Boolean(), server_default=sa.text("1"), nullable=False))
    except Exception:
        pass


def downgrade() -> None:
    op.drop_column("users", "is_active")
