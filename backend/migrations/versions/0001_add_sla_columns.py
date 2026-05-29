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


def upgrade() -> None:
    op.add_column("tickets", sa.Column("sla_deadline", sa.DateTime(), nullable=True))
    op.add_column("tickets", sa.Column("sla_breached", sa.Boolean(), nullable=False, server_default=sa.text("0")))


def downgrade() -> None:
    op.drop_column("tickets", "sla_breached")
    op.drop_column("tickets", "sla_deadline")
