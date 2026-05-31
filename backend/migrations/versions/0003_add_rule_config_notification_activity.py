"""add rule_config, notifications, activity_logs tables

Revision ID: 0003
Revises: 0002
Create Date: 2026-05-30 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rule Config
    try:
        op.create_table(
            "rule_config",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("config_type", sa.String(50), nullable=False),
            sa.Column("key", sa.String(255), nullable=False),
            sa.Column("value", sa.Text(), nullable=True),
            sa.Column("group", sa.String(100), nullable=True),
            sa.Column("score", sa.Integer(), default=0),
            sa.Column("is_active", sa.Boolean(), default=True),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_rule_config_id", "rule_config", ["id"])
        op.create_index("ix_rule_config_config_type", "rule_config", ["config_type"])
    except Exception:
        pass

    # Notifications
    try:
        op.create_table(
            "notifications",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("user_id", sa.String(36), nullable=False),
            sa.Column("notification_type", sa.String(50), nullable=False),
            sa.Column("title", sa.String(255), nullable=False),
            sa.Column("body", sa.Text(), nullable=True),
            sa.Column("link", sa.String(500), nullable=True),
            sa.Column("is_read", sa.Boolean(), default=False),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_notifications_id", "notifications", ["id"])
        op.create_index("ix_notifications_user_id", "notifications", ["user_id"])
    except Exception:
        pass

    # Activity Logs
    try:
        op.create_table(
            "activity_logs",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("activity_type", sa.String(50), nullable=False),
            sa.Column("description", sa.String(500), nullable=False),
            sa.Column("actor_id", sa.String(36), nullable=True),
            sa.Column("ticket_id", sa.String(50), nullable=True),
            sa.Column("metadata_json", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["actor_id"], ["users.id"], ondelete="SET NULL"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_activity_logs_id", "activity_logs", ["id"])
        op.create_index("ix_activity_logs_activity_type", "activity_logs", ["activity_type"])
        op.create_index("ix_activity_logs_actor_id", "activity_logs", ["actor_id"])
        op.create_index("ix_activity_logs_ticket_id", "activity_logs", ["ticket_id"])
    except Exception:
        pass


def downgrade() -> None:
    op.drop_table("activity_logs")
    op.drop_table("notifications")
    op.drop_table("rule_config")
