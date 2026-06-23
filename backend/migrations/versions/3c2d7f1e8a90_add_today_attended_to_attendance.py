"""add today_attended to attendance

Revision ID: 3c2d7f1e8a90
Revises: 2b1c6d9f4a21
Create Date: 2026-06-20 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = '3c2d7f1e8a90'
down_revision = '2b1c6d9f4a21'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('attendance', sa.Column('today_attended', sa.Boolean(), nullable=True))
    op.execute(
        """
        UPDATE attendance
        SET today_attended = CASE
            WHEN absenteeism = 1 THEN FALSE
            ELSE TRUE
        END
        WHERE today_attended IS NULL
        """
    )


def downgrade():
    op.drop_column('attendance', 'today_attended')
