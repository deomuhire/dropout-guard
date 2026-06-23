"""add user phone and password change flag

Revision ID: 2b1c6d9f4a21
Revises: 8aaa7b894aed
Create Date: 2026-05-11 19:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '2b1c6d9f4a21'
down_revision = '8aaa7b894aed'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('phone', sa.String(length=10), nullable=True))
    op.add_column('users', sa.Column(
        'must_change_password',
        sa.Boolean(),
        nullable=False,
        server_default=sa.false()
    ))
    op.alter_column('users', 'must_change_password', server_default=None)


def downgrade():
    op.drop_column('users', 'must_change_password')
    op.drop_column('users', 'phone')
