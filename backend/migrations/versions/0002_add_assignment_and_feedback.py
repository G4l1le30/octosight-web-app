"""add assigned_to/assigned_at to tickets, create ml_feedback table

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-30 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add assignment columns to tickets
    op.add_column("tickets", sa.Column("assigned_to", sa.String(36), nullable=True))
    op.add_column("tickets", sa.Column("assigned_at", sa.DateTime(), nullable=True))
    op.create_foreign_key(
        "fk_tickets_assigned_to",
        "tickets", "users",
        ["assigned_to"], ["id"],
        ondelete="SET NULL",
    )

    # Create ml_feedback table
    op.create_table(
        "ml_feedback",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("ticket_id", sa.String(50), nullable=False),
        sa.Column("admin_id", sa.String(36), nullable=True),
        sa.Column("feedback_type", sa.String(10), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["ticket_id"], ["tickets.ticket_id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["admin_id"], ["users.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ml_feedback_id", "ml_feedback", ["id"])
    op.create_index("ix_ml_feedback_ticket_id", "ml_feedback", ["ticket_id"])


def downgrade() -> None:
    op.drop_table("ml_feedback")
    op.drop_constraint("fk_tickets_assigned_to", "tickets", type_="foreignkey")
    op.drop_column("tickets", "assigned_at")
    op.drop_column("tickets", "assigned_to")
