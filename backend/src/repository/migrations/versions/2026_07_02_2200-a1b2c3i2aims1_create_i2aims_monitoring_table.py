"""create i2aims_monitoring table

Revision ID: a1b2c3i2aims1
Revises: a1b2c3airms1
Create Date: 2026-07-02 22:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "a1b2c3i2aims1"
down_revision = "a1b2c3airms1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop if exists (idempotent)
    op.execute("""
        IF OBJECT_ID('app.FK_i2aims_owner', 'F') IS NOT NULL
            ALTER TABLE app.i2aims_monitoring DROP CONSTRAINT FK_i2aims_owner;
    """)
    op.execute("IF OBJECT_ID('app.i2aims_monitoring', 'U') IS NOT NULL DROP TABLE app.i2aims_monitoring;")

    op.execute("""
        CREATE TABLE app.i2aims_monitoring (
            id                      UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
            upload_batch_id         UNIQUEIDENTIFIER NOT NULL,
            owner_account_id        UNIQUEIDENTIFIER NULL,

            -- Period Tracking
            reporting_year          INT              NOT NULL,
            reporting_month         SMALLINT         NOT NULL,
            field                   NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,

            -- I2AIMS Fields
            record_id               NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            inspection_date         DATE             NULL,
            asset_id                NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            asset_name              NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            asset_type              NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            area                    NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            sce_category            NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            integrity_status        NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            inspection_result       NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            inspection_compliance   NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            corrosion_rate          NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            remaining_life          NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            risk_rank               NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            anomaly_count           NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            process_safety_event    NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            barrier_health          NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            recommendation_status   NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            inspection_cost         NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,

            -- Metadata (timestamps)
            created_at              DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
            updated_at              DATETIMEOFFSET   NULL,

            CONSTRAINT PK_i2aims_monitoring PRIMARY KEY (id),
            CONSTRAINT FK_i2aims_owner FOREIGN KEY (owner_account_id)
                REFERENCES app.account(id) ON DELETE SET NULL
        );
    """)

    # Indexes
    op.execute("""
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_i2aims_monitoring_period'
                       AND object_id = OBJECT_ID('app.i2aims_monitoring'))
        CREATE INDEX IX_i2aims_monitoring_period ON app.i2aims_monitoring (reporting_year, reporting_month, field);
    """)

    op.execute("""
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_i2aims_monitoring_batch'
                       AND object_id = OBJECT_ID('app.i2aims_monitoring'))
        CREATE INDEX IX_i2aims_monitoring_batch ON app.i2aims_monitoring (upload_batch_id);
    """)


def downgrade() -> None:
    op.execute("IF OBJECT_ID('app.i2aims_monitoring', 'U') IS NOT NULL DROP TABLE app.i2aims_monitoring;")
