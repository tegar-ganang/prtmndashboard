"""add field column to all monitoring tables

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-05-16 23:30:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "b2c3d4e5f6a7"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add `field` column to mit_monitoring
    op.execute("""
        IF NOT EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'app' AND TABLE_NAME = 'mit_monitoring' AND COLUMN_NAME = 'field'
        )
        ALTER TABLE app.mit_monitoring ADD field NVARCHAR(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL;
    """)

    # Add `field` column to hazid_monitoring
    op.execute("""
        IF NOT EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'app' AND TABLE_NAME = 'hazid_monitoring' AND COLUMN_NAME = 'field'
        )
        ALTER TABLE app.hazid_monitoring ADD field NVARCHAR(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL;
    """)

    # Add `field` column to hazop_monitoring
    op.execute("""
        IF NOT EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'app' AND TABLE_NAME = 'hazop_monitoring' AND COLUMN_NAME = 'field'
        )
        ALTER TABLE app.hazop_monitoring ADD field NVARCHAR(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL;
    """)

    # Add `field` column to lopa_monitoring
    op.execute("""
        IF NOT EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'app' AND TABLE_NAME = 'lopa_monitoring' AND COLUMN_NAME = 'field'
        )
        ALTER TABLE app.lopa_monitoring ADD field NVARCHAR(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL;
    """)


def downgrade() -> None:
    op.execute("""
        IF EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'app' AND TABLE_NAME = 'mit_monitoring' AND COLUMN_NAME = 'field'
        )
        ALTER TABLE app.mit_monitoring DROP COLUMN field;
    """)
    op.execute("""
        IF EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'app' AND TABLE_NAME = 'hazid_monitoring' AND COLUMN_NAME = 'field'
        )
        ALTER TABLE app.hazid_monitoring DROP COLUMN field;
    """)
    op.execute("""
        IF EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'app' AND TABLE_NAME = 'hazop_monitoring' AND COLUMN_NAME = 'field'
        )
        ALTER TABLE app.hazop_monitoring DROP COLUMN field;
    """)
    op.execute("""
        IF EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'app' AND TABLE_NAME = 'lopa_monitoring' AND COLUMN_NAME = 'field'
        )
        ALTER TABLE app.lopa_monitoring DROP COLUMN field;
    """)
