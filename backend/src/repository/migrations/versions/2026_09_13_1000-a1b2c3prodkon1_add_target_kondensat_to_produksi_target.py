"""add_target_kondensat_to_produksi_target

Revision ID: a1b2c3prodkon1
Revises: a1b2c3scurve1
Create Date: 2026-09-13 10:00:00.000000

Perubahan:
  - Tambah kolom target_kondensat ke produksi_target, agar Sheet 2
    (Target Bulanan) bisa menyimpan target KONDENSAT selain GAS (target_dmf).

Note: Semua operasi menggunakan IF EXISTS/IF NOT EXISTS agar idempotent
      (aman dijalankan ulang jika sebelumnya partial).
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "a1b2c3prodkon1"
down_revision = "a1b2c3scurve1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        IF NOT EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'app'
              AND TABLE_NAME = 'produksi_target'
              AND COLUMN_NAME = 'target_kondensat'
        )
        ALTER TABLE app.produksi_target
        ADD target_kondensat DECIMAL(15, 4) NULL;
    """)


def downgrade() -> None:
    op.execute("""
        IF EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'app'
              AND TABLE_NAME = 'produksi_target'
              AND COLUMN_NAME = 'target_kondensat'
        )
        ALTER TABLE app.produksi_target
        DROP COLUMN target_kondensat;
    """)
