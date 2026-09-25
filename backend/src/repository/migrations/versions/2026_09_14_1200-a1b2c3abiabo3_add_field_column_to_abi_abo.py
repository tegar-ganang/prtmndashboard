"""add_field_column_to_abi_abo

Revision ID: a1b2c3abiabo3
Revises: a1b2c3abiabo2
Create Date: 2026-09-14 12:00:00.000000

The dev container's `create_all()` (runs on every app startup) beat this
migration chain to creating abi_monitoring/abo_monitoring during a
--reload cycle, using an earlier version of the model that didn't have
`field` yet. This migration's own CREATE TABLE in a1b2c3abiabo1 then
no-op'd (`IF OBJECT_ID(...) IS NULL`) since the table already existed,
leaving both tables missing `field`. Add it explicitly, guarded so it's
a no-op once present — same pattern as the `account.is_admin` /
`project.pic` backfills in src/repository/events.py.
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "a1b2c3abiabo3"
down_revision = "a1b2c3abiabo2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    for table in ("abi_monitoring", "abo_monitoring"):
        op.execute(f"""
            IF NOT EXISTS (
                SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = 'app' AND TABLE_NAME = '{table}' AND COLUMN_NAME = 'field'
            )
            ALTER TABLE app.{table}
            ADD field NVARCHAR(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL;
        """)


def downgrade() -> None:
    for table in ("abi_monitoring", "abo_monitoring"):
        op.execute(f"""
            IF EXISTS (
                SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = 'app' AND TABLE_NAME = '{table}' AND COLUMN_NAME = 'field'
            )
            ALTER TABLE app.{table}
            DROP COLUMN field;
        """)
