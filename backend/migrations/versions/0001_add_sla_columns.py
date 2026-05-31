"""add sla_deadline and sla_breached to tickets

Revision ID: 0001
Revises: 
Create Date: 2026-05-29 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _add_column_if_missing(table: str, column: sa.Column) -> None:
    """Add a column, silently skipping if it already exists."""
    try:
        op.add_column(table, column)
    except Exception:
        pass


def upgrade() -> None:
    _add_column_if_missing("tickets", sa.Column("sla_deadline", sa.DateTime(), nullable=True))
    _add_column_if_missing(
        "tickets",
        sa.Column("sla_breached", sa.Boolean(), nullable=False, server_default=sa.text("0")),
    )


def downgrade() -> None:
    op.drop_column("tickets", "sla_breached")
    op.drop_column("tickets", "sla_deadline")
