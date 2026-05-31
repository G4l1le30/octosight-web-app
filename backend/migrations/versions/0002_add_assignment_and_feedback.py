from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _add_column_if_missing(table: str, column: sa.Column) -> None:
    try:
        op.add_column(table, column)
    except Exception:
        pass


def upgrade() -> None:
    # Add assignment columns to tickets (skip if already exist)
    _add_column_if_missing("tickets", sa.Column("assigned_to", sa.String(36), nullable=True))
    _add_column_if_missing("tickets", sa.Column("assigned_at", sa.DateTime(), nullable=True))

    # Foreign key may already exist
    try:
        op.create_foreign_key(
            "fk_tickets_assigned_to",
            "tickets", "users",
            ["assigned_to"], ["id"],
            ondelete="SET NULL",
        )
    except Exception:
        pass

    # Create ml_feedback table (skip if already exists)
    try:
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
    except Exception:
        pass
