"""create hsse_monitoring table

Revision ID: a1b2c3hsse1
Revises: a1b2c3psaims1
Create Date: 2026-07-02 18:30:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "a1b2c3hsse1"
down_revision = "a1b2c3psaims1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop if exists (idempotent)
    op.execute("""
        IF OBJECT_ID('app.FK_hsse_owner', 'F') IS NOT NULL
            ALTER TABLE app.hsse_monitoring DROP CONSTRAINT FK_hsse_owner;
    """)
    op.execute("IF OBJECT_ID('app.hsse_monitoring', 'U') IS NOT NULL DROP TABLE app.hsse_monitoring;")

    op.execute("""
        CREATE TABLE app.hsse_monitoring (
            id                  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
            upload_batch_id     UNIQUEIDENTIFIER NOT NULL,
            owner_account_id    UNIQUEIDENTIFIER NULL,

            -- Period Tracking
            reporting_year      INT              NOT NULL,
            reporting_month     SMALLINT         NOT NULL,
            -- field uses SQL_Latin1_General_CP1_CI_AS collation
            field               NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,

            -- HSSE Fields
            id_izin             NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            tanggal             DATE             NULL,
            bulan_tahun         NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            lokasi              NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            jenis_izin_kerja    NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            job_complete        NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            jumlah_icc          NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            status_dispensasi   NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            jenis_deviasi       NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            status_deviasi      NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            tingkat_resiko      NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,

            -- Metadata (timestamps)
            created_at          DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
            updated_at          DATETIMEOFFSET   NULL,

            CONSTRAINT PK_hsse_monitoring PRIMARY KEY (id),
            CONSTRAINT FK_hsse_owner FOREIGN KEY (owner_account_id)
                REFERENCES app.account(id) ON DELETE SET NULL
        );
    """)

    # Indexes for common filter queries
    op.execute("""
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_hsse_monitoring_period'
                       AND object_id = OBJECT_ID('app.hsse_monitoring'))
        CREATE INDEX IX_hsse_monitoring_period ON app.hsse_monitoring (reporting_year, reporting_month, field);
    """)

    op.execute("""
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_hsse_monitoring_batch'
                       AND object_id = OBJECT_ID('app.hsse_monitoring'))
        CREATE INDEX IX_hsse_monitoring_batch ON app.hsse_monitoring (upload_batch_id);
    """)


def downgrade() -> None:
    op.execute("IF OBJECT_ID('app.hsse_monitoring', 'U') IS NOT NULL DROP TABLE app.hsse_monitoring;")
