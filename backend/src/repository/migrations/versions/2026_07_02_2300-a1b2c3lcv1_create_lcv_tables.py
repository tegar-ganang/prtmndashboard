"""create lcv tables

Revision ID: a1b2c3lcv1
Revises: a1b2c3i2aims1
Create Date: 2026-07-02 23:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "a1b2c3lcv1"
down_revision = "a1b2c3i2aims1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop constraints and tables if exist (idempotent)
    op.execute("IF OBJECT_ID('app.FK_lcv_charter_owner', 'F') IS NOT NULL ALTER TABLE app.lcv_project_charter_budaya DROP CONSTRAINT FK_lcv_charter_owner;")
    op.execute("IF OBJECT_ID('app.FK_lcv_monitoring_owner', 'F') IS NOT NULL ALTER TABLE app.lcv_monitoring DROP CONSTRAINT FK_lcv_monitoring_owner;")
    op.execute("IF OBJECT_ID('app.lcv_project_charter_budaya', 'U') IS NOT NULL DROP TABLE app.lcv_project_charter_budaya;")
    op.execute("IF OBJECT_ID('app.lcv_monitoring', 'U') IS NOT NULL DROP TABLE app.lcv_monitoring;")

    # 1. Create lcv_project_charter_budaya
    op.execute("""
        CREATE TABLE app.lcv_project_charter_budaya (
            id                  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
            upload_batch_id     UNIQUEIDENTIFIER NOT NULL,
            owner_account_id    UNIQUEIDENTIFIER NULL,

            -- Period Tracking
            reporting_year      INT              NOT NULL,
            reporting_month     SMALLINT         NOT NULL DEFAULT 1,
            field               NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,

            -- Columns
            id_project          NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            tanggal             DATE             NULL,
            judul_project       NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,

            -- Metadata
            created_at          DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
            updated_at          DATETIMEOFFSET   NULL,

            CONSTRAINT PK_lcv_project_charter_budaya PRIMARY KEY (id),
            CONSTRAINT FK_lcv_charter_owner FOREIGN KEY (owner_account_id)
                REFERENCES app.account(id) ON DELETE SET NULL
        );
    """)

    # 2. Create lcv_monitoring
    op.execute("""
        CREATE TABLE app.lcv_monitoring (
            id                              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
            upload_batch_id                 UNIQUEIDENTIFIER NOT NULL,
            owner_account_id                UNIQUEIDENTIFIER NULL,

            -- Period Tracking
            reporting_year                  INT              NOT NULL,
            reporting_month                 SMALLINT         NOT NULL DEFAULT 1,
            field                           NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,

            -- Columns
            namapegawai                     NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            nip                             NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            departemen                      NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            lcv_conflictofinterest          NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            lcv_codeofconduct               NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            lcv_laporgratifikasi            NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            lcv_sosialisasi_lcv             NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            lcv_lhkpn                       NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            training_isec                   NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            training_lcv                    NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            trainining_virtualdemoroomhsse  NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            training_stressmanagement       NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            training_fraudawareness         NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            projectchapterbudaya            NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            tahun                           NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,

            -- Metadata
            created_at                      DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
            updated_at                      DATETIMEOFFSET   NULL,

            CONSTRAINT PK_lcv_monitoring PRIMARY KEY (id),
            CONSTRAINT FK_lcv_monitoring_owner FOREIGN KEY (owner_account_id)
                REFERENCES app.account(id) ON DELETE SET NULL
        );
    """)

    # Indexes
    op.execute("CREATE INDEX IX_lcv_charter_period ON app.lcv_project_charter_budaya (reporting_year, reporting_month);")
    op.execute("CREATE INDEX IX_lcv_charter_batch ON app.lcv_project_charter_budaya (upload_batch_id);")

    op.execute("CREATE INDEX IX_lcv_monitoring_period ON app.lcv_monitoring (reporting_year, reporting_month);")
    op.execute("CREATE INDEX IX_lcv_monitoring_batch ON app.lcv_monitoring (upload_batch_id);")


def downgrade() -> None:
    op.execute("IF OBJECT_ID('app.lcv_project_charter_budaya', 'U') IS NOT NULL DROP TABLE app.lcv_project_charter_budaya;")
    op.execute("IF OBJECT_ID('app.lcv_monitoring', 'U') IS NOT NULL DROP TABLE app.lcv_monitoring;")
