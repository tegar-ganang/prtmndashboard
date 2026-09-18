"""add_bbls_actl_to_produksi_monitoring

Revision ID: a1b2c3prodbbls1
Revises: a1b2c3martsync6
Create Date: 2026-09-18 09:00:00.000000

Kolom AA di template (X1:AA1 merge = "BBLS - DONGGI MATINDOK FIELD",
sub-header "ACTL") sebelumnya salah dipetakan ke safe_man_hours_actl lewat
fallback posisi di produksi.py, karena tidak ada kolom bbls_actl di tabel.
Ini nambahin kolom yang seharusnya, agar BBLS punya 4 field lengkap
(processed_water, water_injection, closing_stock, actl) sesuai template.
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "a1b2c3prodbbls1"
down_revision = "a1b2c3martsync6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        IF NOT EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'app'
              AND TABLE_NAME = 'produksi_monitoring'
              AND COLUMN_NAME = 'bbls_actl'
        )
        ALTER TABLE app.produksi_monitoring
        ADD bbls_actl DECIMAL(15, 4) NULL;
    """)


def downgrade() -> None:
    op.execute("""
        IF EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'app'
              AND TABLE_NAME = 'produksi_monitoring'
              AND COLUMN_NAME = 'bbls_actl'
        )
        ALTER TABLE app.produksi_monitoring
        DROP COLUMN bbls_actl;
    """)
