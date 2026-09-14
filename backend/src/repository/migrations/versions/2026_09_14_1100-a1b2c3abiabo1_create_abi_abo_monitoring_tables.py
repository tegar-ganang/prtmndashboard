"""create abi_monitoring and abo_monitoring tables

Revision ID: a1b2c3abiabo1
Revises: a1b2c3martsync3
Create Date: 2026-09-14 11:00:00.000000

ABI/ABO budget-tracking modules under the OSF section. Column set mirrors
mart_pertamina.abi / mart_pertamina.abo (see scripts/mart_pertamina_schema.sql)
so the shapes line up 1:1 for a future sync. Numeric-looking fields are
stored as NVARCHAR, same convention as AIRMS/I2AIMS, since the generic
upload path (BaseMonitoringRepository.create_batch) always stringifies
mapped values before insert.
"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "a1b2c3abiabo1"
down_revision = "a1b2c3martsync3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        IF OBJECT_ID('app.abi_monitoring', 'U') IS NULL
        CREATE TABLE app.abi_monitoring (
            id                          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
            upload_batch_id             UNIQUEIDENTIFIER NOT NULL,
            owner_account_id            UNIQUEIDENTIFIER NULL,

            reporting_year              INT              NOT NULL,
            reporting_month             SMALLINT         NOT NULL,
            field                       NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,

            ref_wbs                     NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            wbs                         NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            nilai_usd                   NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            nilai_idr                   NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            nilai_percent               NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            commitment_nilai_idr        NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            commitment_percent_idr      NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            sa_approved_ppn_idr         NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            sa_approved_ppn_percent     NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            actual_invoice_nilai_idr    NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            actual_invoice_percent      NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            sisa_anggaran_nilai_idr     NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            sisa_anggaran_percent_idr   NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            nilai_total_abi             NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            keterangan_1                NVARCHAR(MAX)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            keterangan_2                NVARCHAR(MAX)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,

            created_at                  DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
            updated_at                  DATETIMEOFFSET   NULL,

            CONSTRAINT PK_abi_monitoring PRIMARY KEY (id),
            CONSTRAINT FK_abi_owner FOREIGN KEY (owner_account_id)
                REFERENCES app.account(id) ON DELETE SET NULL
        );
    """)

    op.execute("""
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_abi_monitoring_period'
                       AND object_id = OBJECT_ID('app.abi_monitoring'))
        CREATE INDEX IX_abi_monitoring_period ON app.abi_monitoring (reporting_year, reporting_month);
    """)
    op.execute("""
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_abi_monitoring_batch'
                       AND object_id = OBJECT_ID('app.abi_monitoring'))
        CREATE INDEX IX_abi_monitoring_batch ON app.abi_monitoring (upload_batch_id);
    """)

    op.execute("""
        IF OBJECT_ID('app.abo_monitoring', 'U') IS NULL
        CREATE TABLE app.abo_monitoring (
            id                              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
            upload_batch_id                 UNIQUEIDENTIFIER NOT NULL,
            owner_account_id                UNIQUEIDENTIFIER NULL,

            reporting_year                  INT              NOT NULL,
            reporting_month                 SMALLINT         NOT NULL,
            field                           NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,

            no_rk                           NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            jenis_kerangka_anggaran         NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            anggaranwpb_osf_nilai_usd       NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            anggaranwpb_osf_nilai_idr       NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            anggaranwpb_osf_percent         NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            commitment_spk_ppn_nilai_idr    NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            commitment_spk_ppn_percent      NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            sa_approved_ppn_nilai_usd       NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            sa_approved_ppn_percent_usd     NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            sa_approved_ppn_nilai_idr       NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            sa_approved_ppn_percent_idr     NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            actual_invoice_nilai_usd        NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            actual_invoice_percent_usd      NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            actual_invoice_nilai_idr        NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            actual_invoice_percent_idr      NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            sisa_anggaran_nilai_usd         NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            sisa_anggaran_percent_usd       NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            sisa_anggaran_nilai_idr         NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            sisa_anggaran_percent_idr       NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            flag                            NVARCHAR(10)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,

            created_at                      DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
            updated_at                      DATETIMEOFFSET   NULL,

            CONSTRAINT PK_abo_monitoring PRIMARY KEY (id),
            CONSTRAINT FK_abo_owner FOREIGN KEY (owner_account_id)
                REFERENCES app.account(id) ON DELETE SET NULL
        );
    """)

    op.execute("""
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_abo_monitoring_period'
                       AND object_id = OBJECT_ID('app.abo_monitoring'))
        CREATE INDEX IX_abo_monitoring_period ON app.abo_monitoring (reporting_year, reporting_month);
    """)
    op.execute("""
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_abo_monitoring_batch'
                       AND object_id = OBJECT_ID('app.abo_monitoring'))
        CREATE INDEX IX_abo_monitoring_batch ON app.abo_monitoring (upload_batch_id);
    """)


def downgrade() -> None:
    op.execute("IF OBJECT_ID('app.abo_monitoring', 'U') IS NOT NULL DROP TABLE app.abo_monitoring;")
    op.execute("IF OBJECT_ID('app.abi_monitoring', 'U') IS NOT NULL DROP TABLE app.abi_monitoring;")
