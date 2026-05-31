"""split_produksi_monitoring_into_realisasi_and_target

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-05-31 07:00:00.000000

Perubahan:
  - Buat tabel produksi_target (data Sheet 2 – Target Bulanan)
  - Hapus kolom target_dmf dari produksi_monitoring
  - Tambah kolom target_id (FK → produksi_target.id) ke produksi_monitoring

Note: Semua operasi menggunakan IF EXISTS/IF NOT EXISTS agar idempotent
      (aman dijalankan ulang jika sebelumnya partial).
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "e5f6a7b8c9d0"
down_revision = "d4e5f6a7b8c9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 1. Buat tabel produksi_target (idempotent) ────────────────────────────
    op.execute("""
        IF OBJECT_ID('app.produksi_target', 'U') IS NULL
        BEGIN
            CREATE TABLE app.produksi_target (
                id                  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
                upload_batch_id     UNIQUEIDENTIFIER NOT NULL,
                owner_account_id    UNIQUEIDENTIFIER NULL,

                -- Periode
                reporting_year      INT              NOT NULL,
                reporting_month     SMALLINT         NOT NULL,
                field               VARCHAR(50)      NULL,

                -- Target MMSCFD DMF
                target_dmf          DECIMAL(15, 4)   NULL,

                -- Metadata
                created_at          DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
                updated_at          DATETIMEOFFSET   NULL,

                CONSTRAINT PK_produksi_target PRIMARY KEY (id),
                CONSTRAINT FK_produksi_target_owner FOREIGN KEY (owner_account_id)
                    REFERENCES app.account(id) ON DELETE SET NULL
            );
        END
    """)

    # Add FK for field (idempotent)
    op.execute("""
        IF OBJECT_ID('app.FK_produksi_target_field', 'F') IS NULL
            ALTER TABLE app.produksi_target
            ADD CONSTRAINT FK_produksi_target_field
            FOREIGN KEY (field) REFERENCES app.field_location(code);
    """)

    # Index untuk lookup bulanan (idempotent)
    op.execute("""
        IF NOT EXISTS (
            SELECT 1 FROM sys.indexes
            WHERE name = 'IX_produksi_target_year_month_field'
              AND object_id = OBJECT_ID('app.produksi_target')
        )
        CREATE INDEX IX_produksi_target_year_month_field
        ON app.produksi_target (reporting_year, reporting_month, field);
    """)

    # ── 2. Hapus kolom target_dmf dari produksi_monitoring (idempotent) ───────
    op.execute("""
        IF EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'app'
              AND TABLE_NAME = 'produksi_monitoring'
              AND COLUMN_NAME = 'target_dmf'
        )
        ALTER TABLE app.produksi_monitoring
        DROP COLUMN target_dmf;
    """)

    # ── 3. Tambah kolom target_id (FK) ke produksi_monitoring (idempotent) ────
    op.execute("""
        IF NOT EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'app'
              AND TABLE_NAME = 'produksi_monitoring'
              AND COLUMN_NAME = 'target_id'
        )
        ALTER TABLE app.produksi_monitoring
        ADD target_id UNIQUEIDENTIFIER NULL;
    """)

    op.execute("""
        IF OBJECT_ID('app.FK_produksi_target_id', 'F') IS NULL
            ALTER TABLE app.produksi_monitoring
            ADD CONSTRAINT FK_produksi_target_id
            FOREIGN KEY (target_id) REFERENCES app.produksi_target(id) ON DELETE SET NULL;
    """)


def downgrade() -> None:
    # ── 1. Hapus FK dan kolom target_id dari produksi_monitoring ──────────────
    op.execute("""
        IF OBJECT_ID('app.FK_produksi_target_id', 'F') IS NOT NULL
            ALTER TABLE app.produksi_monitoring
            DROP CONSTRAINT FK_produksi_target_id;
    """)

    op.execute("""
        IF EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'app'
              AND TABLE_NAME = 'produksi_monitoring'
              AND COLUMN_NAME = 'target_id'
        )
        ALTER TABLE app.produksi_monitoring
        DROP COLUMN target_id;
    """)

    # ── 2. Kembalikan kolom target_dmf ke produksi_monitoring ─────────────────
    op.execute("""
        IF NOT EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'app'
              AND TABLE_NAME = 'produksi_monitoring'
              AND COLUMN_NAME = 'target_dmf'
        )
        ALTER TABLE app.produksi_monitoring
        ADD target_dmf DECIMAL(15, 4) NULL;
    """)

    # ── 3. Drop tabel produksi_target ─────────────────────────────────────────
    op.execute("""
        IF OBJECT_ID('app.FK_produksi_target_field', 'F') IS NOT NULL
            ALTER TABLE app.produksi_target
            DROP CONSTRAINT FK_produksi_target_field;
    """)

    op.execute("""
        IF OBJECT_ID('app.produksi_target', 'U') IS NOT NULL
            DROP TABLE app.produksi_target;
    """)
