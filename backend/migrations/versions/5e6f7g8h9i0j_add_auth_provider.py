"""add auth_provider column to users table

Revision ID: 5e6f7g8h9i0j
Revises: 4a5b6c7d8e9f
Create Date: 2026-06-06 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '5e6f7g8h9i0j'
down_revision: Union[str, Sequence[str], None] = '4a5b6c7d8e9f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    user_cols = [c['name'] for c in inspector.get_columns('users')]
    if 'auth_provider' not in user_cols:
        op.add_column('users', sa.Column('auth_provider', sa.String(20), nullable=False, server_default='email'))


def downgrade() -> None:
    op.drop_column('users', 'auth_provider')
