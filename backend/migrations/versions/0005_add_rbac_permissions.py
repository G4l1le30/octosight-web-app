"""add permissions and role_permissions tables for granular RBAC

Revision ID: 0005
Revises: 0004
Create Date: 2026-06-01 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    try:
        op.create_table(
            "permissions",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("code", sa.String(100), nullable=False),
            sa.Column("description", sa.String(255), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_permissions_code", "permissions", ["code"], unique=True)
    except Exception:
        pass

    try:
        op.create_table(
            "role_permissions",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("role", sa.String(20), nullable=False),
            sa.Column("permission_id", sa.Integer(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
            sa.ForeignKeyConstraint(["permission_id"], ["permissions.id"], ondelete="CASCADE"),
        )
        op.create_index("ix_role_permissions_role", "role_permissions", ["role"])
        op.create_unique_constraint("uq_role_permission", "role_permissions", ["role", "permission_id"])
    except Exception:
        pass


def downgrade() -> None:
    op.drop_table("role_permissions")
    op.drop_table("permissions")
