"""change content column from Text to JSON

Revision ID: 2a1b3c4d5e6f
Revises: f55f4fc93a42
Create Date: 2026-06-03 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

revision: str = '2a1b3c4d5e6f'
down_revision: Union[str, Sequence[str], None] = 'f55f4fc93a42'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    article_cols = [c['name'] for c in inspector.get_columns('education_articles')]
    if 'content' in article_cols:
        op.alter_column('education_articles', 'content',
                        existing_type=sa.Text(),
                        type_=mysql.JSON(),
                        existing_nullable=True)


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    article_cols = [c['name'] for c in inspector.get_columns('education_articles')]
    if 'content' in article_cols:
        op.alter_column('education_articles', 'content',
                        existing_type=mysql.JSON(),
                        type_=sa.Text(),
                        existing_nullable=True)
