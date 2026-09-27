"""add_wpb_targets_to_produksi_target

Revision ID: a1b2c3prodwpb1
Revises: a1b2c3martsync9
Create Date: 2026-09-27 10:00:00.000000

Sheet 2 of the Produksi upload now carries 4 monthly targets (DMF, GAS WP&B,
KONDENSAT RKAP, KONDENSAT WP&B). target_dmf already holds DMF; the other three
get their own columns (the legacy target_kondensat is left untouched, matching
the sp_sync_produksi_target that lives in the `master` database).
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "a1b2c3prodwpb1"
down_revision = "a1b2c3martsync9"
branch_labels = None
depends_on = None

_COLUMNS = ("target_gas_wpb", "target_kondensat_rkap", "target_kondensat_wpb")


def upgrade() -> None:
    for col in _COLUMNS:
        op.execute(f"""
            IF NOT EXISTS (
                SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = 'app' AND TABLE_NAME = 'produksi_target' AND COLUMN_NAME = '{col}'
            )
            ALTER TABLE app.produksi_target ADD {col} DECIMAL(15, 4) NULL;
        """)


def downgrade() -> None:
    for col in _COLUMNS:
        op.execute(f"""
            IF EXISTS (
                SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = 'app' AND TABLE_NAME = 'produksi_target' AND COLUMN_NAME = '{col}'
            )
            ALTER TABLE app.produksi_target DROP COLUMN {col};
        """)
