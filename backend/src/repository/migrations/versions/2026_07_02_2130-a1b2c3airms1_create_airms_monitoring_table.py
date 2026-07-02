"""create airms_monitoring table

Revision ID: a1b2c3airms1
Revises: a1b2c3hsse1
Create Date: 2026-07-02 21:30:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "a1b2c3airms1"
down_revision = "a1b2c3hsse1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop if exists (idempotent)
    op.execute("""
        IF OBJECT_ID('app.FK_airms_owner', 'F') IS NOT NULL
            ALTER TABLE app.airms_monitoring DROP CONSTRAINT FK_airms_owner;
    """)
    op.execute("IF OBJECT_ID('app.airms_monitoring', 'U') IS NOT NULL DROP TABLE app.airms_monitoring;")

    op.execute("""
        CREATE TABLE app.airms_monitoring (
            id                  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
            upload_batch_id     UNIQUEIDENTIFIER NOT NULL,
            owner_account_id    UNIQUEIDENTIFIER NULL,

            -- Period Tracking
            reporting_year      INT              NOT NULL,
            reporting_month     SMALLINT         NOT NULL,
            -- field uses SQL_Latin1_General_CP1_CI_AS collation
            field               NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,

            -- AIRMS Fields
            record_id           NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            date                DATE             NULL,
            asset_id            NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            asset_name          NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            area                NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            availability        NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            reliability         NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            mtbf                NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            mttr                NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            wo_type             NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            wo_status           NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            maintenance_cost    NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            downtime_type       NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            downtime_hours      NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            lost_boe            NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            health_index        NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,

            -- Metadata (timestamps)
            created_at          DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
            updated_at          DATETIMEOFFSET   NULL,

            CONSTRAINT PK_airms_monitoring PRIMARY KEY (id),
            CONSTRAINT FK_airms_owner FOREIGN KEY (owner_account_id)
                REFERENCES app.account(id) ON DELETE SET NULL
        );
    """)

    # Indexes for common filter queries
    op.execute("""
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_airms_monitoring_period'
                       AND object_id = OBJECT_ID('app.airms_monitoring'))
        CREATE INDEX IX_airms_monitoring_period ON app.airms_monitoring (reporting_year, reporting_month, field);
    """)

    op.execute("""
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_airms_monitoring_batch'
                       AND object_id = OBJECT_ID('app.airms_monitoring'))
        CREATE INDEX IX_airms_monitoring_batch ON app.airms_monitoring (upload_batch_id);
    """)


def downgrade() -> None:
    op.execute("IF OBJECT_ID('app.airms_monitoring', 'U') IS NOT NULL DROP TABLE app.airms_monitoring;")
