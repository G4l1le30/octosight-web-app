"""add missing indexes and reset_token columns

Revision ID: 4a5b6c7d8e9f
Revises: 3c4d5e6f7g8h
Create Date: 2026-06-03 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '4a5b6c7d8e9f'
down_revision: Union[str, Sequence[str], None] = '3c4d5e6f7g8h'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    # ── Password reset columns on users ────────────────────────────────────
    user_cols = [c['name'] for c in inspector.get_columns('users')]
    if 'reset_token_hash' not in user_cols:
        op.add_column('users', sa.Column('reset_token_hash', sa.String(64), nullable=True))
        op.create_index('ix_users_reset_token_hash', 'users', ['reset_token_hash'])
    if 'reset_token_expires_at' not in user_cols:
        op.add_column('users', sa.Column('reset_token_expires_at', sa.DateTime(), nullable=True))

    # ── Missing indexes on tickets ─────────────────────────────────────────
    ticket_indexes = [ix['name'] for ix in inspector.get_indexes('tickets')]
    ticket_index_map = {
        'ix_tickets_status': 'status',
        'ix_tickets_priority': 'priority',
        'ix_tickets_type': 'type',
        'ix_tickets_user_id': 'user_id',
        'ix_tickets_created_at': 'created_at',
        'ix_tickets_assigned_to': 'assigned_to',
    }
    for idx_name, col in ticket_index_map.items():
        if idx_name not in ticket_indexes:
            op.create_index(idx_name, 'tickets', [col])

    # ── Indexes on education_articles ──────────────────────────────────────
    article_indexes = [ix['name'] for ix in inspector.get_indexes('education_articles')]
    if 'ix_education_articles_module_id' not in article_indexes:
        op.create_index('ix_education_articles_module_id', 'education_articles', ['module_id'])

    # ── Indexes on user_article_progress ───────────────────────────────────
    uap_indexes = [ix['name'] for ix in inspector.get_indexes('user_article_progress')]
    if 'ix_user_article_progress_user_id' not in uap_indexes:
        op.create_index('ix_user_article_progress_user_id', 'user_article_progress', ['user_id'])
    if 'ix_user_article_progress_article_id' not in uap_indexes:
        op.create_index('ix_user_article_progress_article_id', 'user_article_progress', ['article_id'])

    # ── Indexes on user_quiz_attempts ──────────────────────────────────────
    uqa_indexes = [ix['name'] for ix in inspector.get_indexes('user_quiz_attempts')]
    if 'ix_user_quiz_attempts_user_id' not in uqa_indexes:
        op.create_index('ix_user_quiz_attempts_user_id', 'user_quiz_attempts', ['user_id'])
    if 'ix_user_quiz_attempts_module_id' not in uqa_indexes:
        op.create_index('ix_user_quiz_attempts_module_id', 'user_quiz_attempts', ['module_id'])

    # ── Indexes on mock_bank_transactions ──────────────────────────────────
    mbt_indexes = [ix['name'] for ix in inspector.get_indexes('mock_bank_transactions')]
    if 'ix_mock_bank_transactions_sender_account' not in mbt_indexes:
        op.create_index('ix_mock_bank_transactions_sender_account', 'mock_bank_transactions', ['sender_account'])
    if 'ix_mock_bank_transactions_receiver_account' not in mbt_indexes:
        op.create_index('ix_mock_bank_transactions_receiver_account', 'mock_bank_transactions', ['receiver_account'])


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    # Remove reset token columns
    user_cols = [c['name'] for c in inspector.get_columns('users')]
    if 'reset_token_expires_at' in user_cols:
        op.drop_column('users', 'reset_token_expires_at')
    if 'reset_token_hash' in user_cols:
        op.drop_index('ix_users_reset_token_hash', 'users')
        op.drop_column('users', 'reset_token_hash')

    # Drop ticket indexes
    ticket_indexes = [ix['name'] for ix in inspector.get_indexes('tickets')]
    for idx_name in ['ix_tickets_status', 'ix_tickets_priority', 'ix_tickets_type', 'ix_tickets_user_id', 'ix_tickets_created_at', 'ix_tickets_assigned_to']:
        if idx_name in ticket_indexes:
            op.drop_index(idx_name, 'tickets')

    # Drop education_articles indexes
    article_indexes = [ix['name'] for ix in inspector.get_indexes('education_articles')]
    if 'ix_education_articles_module_id' in article_indexes:
        op.drop_index('ix_education_articles_module_id', 'education_articles')

    # Drop user_article_progress indexes
    uap_indexes = [ix['name'] for ix in inspector.get_indexes('user_article_progress')]
    for idx_name in ['ix_user_article_progress_user_id', 'ix_user_article_progress_article_id']:
        if idx_name in uap_indexes:
            op.drop_index(idx_name, 'user_article_progress')

    # Drop user_quiz_attempts indexes
    uqa_indexes = [ix['name'] for ix in inspector.get_indexes('user_quiz_attempts')]
    for idx_name in ['ix_user_quiz_attempts_user_id', 'ix_user_quiz_attempts_module_id']:
        if idx_name in uqa_indexes:
            op.drop_index(idx_name, 'user_quiz_attempts')

    # Drop mock_bank_transactions indexes
    mbt_indexes = [ix['name'] for ix in inspector.get_indexes('mock_bank_transactions')]
    for idx_name in ['ix_mock_bank_transactions_sender_account', 'ix_mock_bank_transactions_receiver_account']:
        if idx_name in mbt_indexes:
            op.drop_index(idx_name, 'mock_bank_transactions')
