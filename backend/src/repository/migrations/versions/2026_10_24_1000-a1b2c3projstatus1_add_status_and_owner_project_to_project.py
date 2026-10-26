"""add status and owner_project to project

Revision ID: a1b2c3projstatus1
Revises: a1b2c3projtype1
Create Date: 2026-10-24 10:00:00.000000

Status project: PRE_EKSEKUSI (default project baru) / EKSEKUSI.
Project lama di-set EKSEKUSI supaya progress/S-Curve yang sudah ada tetap jalan.
owner_project = nama owner project (string bebas), beda dengan owner_account_id (akun pembuat).
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "a1b2c3projstatus1"
down_revision = "a1b2c3projtype1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # EXEC defers compiling the UPDATE until the column exists (same batch as the ALTER).
    op.execute("""
        IF NOT EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'app'
              AND TABLE_NAME = 'project'
              AND COLUMN_NAME = 'status'
        )
        BEGIN
            ALTER TABLE app.project
            ADD status NVARCHAR(20) NOT NULL
                CONSTRAINT DF_project_status DEFAULT 'PRE_EKSEKUSI'
                CONSTRAINT CK_project_status CHECK (status IN ('PRE_EKSEKUSI', 'EKSEKUSI'));
            EXEC('UPDATE app.project SET status = ''EKSEKUSI''');
        END
    """)
    op.execute("""
        IF NOT EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'app'
              AND TABLE_NAME = 'project'
              AND COLUMN_NAME = 'owner_project'
        )
        ALTER TABLE app.project ADD owner_project NVARCHAR(150) NULL;
    """)


def downgrade() -> None:
    op.execute("""
        IF EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'app'
              AND TABLE_NAME = 'project'
              AND COLUMN_NAME = 'owner_project'
        )
        ALTER TABLE app.project DROP COLUMN owner_project;
    """)
    op.execute("""
        IF EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'app'
              AND TABLE_NAME = 'project'
              AND COLUMN_NAME = 'status'
        )
        BEGIN
            ALTER TABLE app.project DROP CONSTRAINT CK_project_status;
            ALTER TABLE app.project DROP CONSTRAINT DF_project_status;
            ALTER TABLE app.project DROP COLUMN status;
        END
    """)
