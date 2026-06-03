"""add_image_url_and_content_to_education

Revision ID: f55f4fc93a42
Revises: 
Create Date: 2026-06-02 17:21:25.633254

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f55f4fc93a42'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    # Add columns to education_articles if they don't exist
    article_cols = [c['name'] for c in inspector.get_columns('education_articles')]
    if 'image_url' not in article_cols:
        op.add_column('education_articles', sa.Column('image_url', sa.Text(), nullable=True))
    if 'content' not in article_cols:
        op.add_column('education_articles', sa.Column('content', sa.Text(), nullable=True))

    # Add columns to education_modules if they don't exist
    module_cols = [c['name'] for c in inspector.get_columns('education_modules')]
    if 'image_url' not in module_cols:
        op.add_column('education_modules', sa.Column('image_url', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    module_cols = [c['name'] for c in inspector.get_columns('education_modules')]
    if 'image_url' in module_cols:
        op.drop_column('education_modules', 'image_url')

    article_cols = [c['name'] for c in inspector.get_columns('education_articles')]
    if 'content' in article_cols:
        op.drop_column('education_articles', 'content')
    if 'image_url' in article_cols:
        op.drop_column('education_articles', 'image_url')
