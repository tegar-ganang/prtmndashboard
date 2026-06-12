"""create moc_monitoring table

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-06-12 22:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "f6a7b8c9d0e1"
down_revision = "e5f6a7b8c9d0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop if exists (idempotent)
    op.execute("""
        IF OBJECT_ID('app.FK_moc_field', 'F') IS NOT NULL
            ALTER TABLE app.moc_monitoring DROP CONSTRAINT FK_moc_field;
    """)
    op.execute("IF OBJECT_ID('app.moc_monitoring', 'U') IS NOT NULL DROP TABLE app.moc_monitoring;")

    op.execute("""
        CREATE TABLE app.moc_monitoring (
            id                  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
            upload_batch_id     UNIQUEIDENTIFIER NOT NULL,
            owner_account_id    UNIQUEIDENTIFIER NULL,

            -- Period Tracking
            reporting_year      INT              NOT NULL,
            reporting_month     SMALLINT         NOT NULL,
            -- NOTE: field uses SQL_Latin1_General_CP1_CI_AS to match field_location.code collation
            field               NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,

            -- MOC Fields
            moc_number          NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            change_desc         NVARCHAR(MAX)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            issued_date         DATE             NULL,
            done                NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            moc_owner           NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            last_updated        DATE             NULL,
            ongoing_step        NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            pic                 NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            status              NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,

            -- Metadata (timestamps)
            created_at          DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
            updated_at          DATETIMEOFFSET   NULL,

            CONSTRAINT PK_moc_monitoring PRIMARY KEY (id),
            CONSTRAINT FK_moc_owner FOREIGN KEY (owner_account_id)
                REFERENCES app.account(id) ON DELETE SET NULL
        );
    """)

    # Indexes for common filter queries
    op.execute("""
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_moc_monitoring_period'
                       AND object_id = OBJECT_ID('app.moc_monitoring'))
        CREATE INDEX IX_moc_monitoring_period ON app.moc_monitoring (reporting_year, reporting_month, field);
    """)

    op.execute("""
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_moc_monitoring_batch'
                       AND object_id = OBJECT_ID('app.moc_monitoring'))
        CREATE INDEX IX_moc_monitoring_batch ON app.moc_monitoring (upload_batch_id);
    """)


def downgrade() -> None:
    op.execute("IF OBJECT_ID('app.moc_monitoring', 'U') IS NOT NULL DROP TABLE app.moc_monitoring;")
