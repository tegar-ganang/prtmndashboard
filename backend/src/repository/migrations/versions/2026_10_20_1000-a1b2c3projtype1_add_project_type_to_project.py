"""add project_type to project

Revision ID: a1b2c3projtype1
Revises: a1b2c3widen1
Create Date: 2026-10-20 10:00:00.000000

Kategori project: BD (Business Development) / NON_BD (Non Business Development).
Tetap satu tabel; project lama otomatis NON_BD lewat default.
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "a1b2c3projtype1"
down_revision = "a1b2c3widen1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        IF NOT EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'app'
              AND TABLE_NAME = 'project'
              AND COLUMN_NAME = 'project_type'
        )
        ALTER TABLE app.project
        ADD project_type NVARCHAR(20) NOT NULL
            CONSTRAINT DF_project_type DEFAULT 'NON_BD'
            CONSTRAINT CK_project_type CHECK (project_type IN ('BD', 'NON_BD'));
    """)


def downgrade() -> None:
    op.execute("""
        IF EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'app'
              AND TABLE_NAME = 'project'
              AND COLUMN_NAME = 'project_type'
        )
        BEGIN
            ALTER TABLE app.project DROP CONSTRAINT CK_project_type;
            ALTER TABLE app.project DROP CONSTRAINT DF_project_type;
            ALTER TABLE app.project DROP COLUMN project_type;
        END
    """)
