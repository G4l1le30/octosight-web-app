"""add order_index to education_articles

Revision ID: 3c4d5e6f7g8h
Revises: 2a1b3c4d5e6f
Create Date: 2026-06-03 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '3c4d5e6f7g8h'
down_revision: Union[str, Sequence[str], None] = '2a1b3c4d5e6f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    article_cols = [c['name'] for c in inspector.get_columns('education_articles')]
    if 'order_index' not in article_cols:
        op.add_column('education_articles', sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'))
        op.alter_column('education_articles', 'order_index', server_default=None)


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    article_cols = [c['name'] for c in inspector.get_columns('education_articles')]
    if 'order_index' in article_cols:
        op.drop_column('education_articles', 'order_index')
