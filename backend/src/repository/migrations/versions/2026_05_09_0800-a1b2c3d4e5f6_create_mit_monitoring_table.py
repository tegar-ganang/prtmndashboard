"""create mit_monitoring table with nvarchar DDL

Revision ID: a1b2c3d4e5f6
Revises: 60d1844cb5d3
Create Date: 2026-05-09 08:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f6"
down_revision = "60d1844cb5d3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop existing mit_monitoring if exists (old VARCHAR version)
    op.execute("IF OBJECT_ID('app.mit_monitoring', 'U') IS NOT NULL DROP TABLE app.mit_monitoring;")

    # Recreate with proper NVARCHAR and DATETIMEOFFSET as per DDL spec
    op.execute("""
        CREATE TABLE app.mit_monitoring (
            id                  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
            upload_batch_id     UNIQUEIDENTIFIER NOT NULL,
            owner_account_id    UNIQUEIDENTIFIER NULL,

            -- 1. No Registration Breakdown
            area                NVARCHAR(100)  COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            reg_lokasi          NVARCHAR(50)   COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            reg_jenis_mit       NVARCHAR(50)   COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            reg_kategori        NVARCHAR(50)   COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            reg_tahun           NVARCHAR(10)   COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            reg_no              NVARCHAR(50)   COLLATE SQL_Latin1_General_CP1_CI_AS NULL,

            -- 2. Information & Scenario
            mit_declaration_date DATE NULL,
            mit_title_asset     NVARCHAR(255)  COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            integrity_threats   NVARCHAR(MAX)  COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            possible_scenario   NVARCHAR(MAX)  COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            consequences        NVARCHAR(MAX)  COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            available_safeguard NVARCHAR(MAX)  COLLATE SQL_Latin1_General_CP1_CI_AS NULL,

            -- 3. Current Risk Assessment
            current_likelihood  NVARCHAR(50)   COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            current_severity    NVARCHAR(50)   COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            current_risk_rating NVARCHAR(100)  COLLATE SQL_Latin1_General_CP1_CI_AS NULL,

            -- 4. Recommendations
            rec_no              NVARCHAR(100)  COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            recommendation_action NVARCHAR(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            pic                 NVARCHAR(255)  COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            target_closing      DATE NULL,
            remarks             NVARCHAR(MAX)  COLLATE SQL_Latin1_General_CP1_CI_AS NULL,

            -- 5. Target Risk (Post-Recommendation)
            target_likelihood   NVARCHAR(50)   COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            target_severity     NVARCHAR(50)   COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            target_risk_rating  NVARCHAR(100)  COLLATE SQL_Latin1_General_CP1_CI_AS NULL,

            -- 6. Status & Validation
            mit_status          NVARCHAR(100)  COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            evidence_path       NVARCHAR(MAX)  COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            closing_date        DATE NULL,

            -- Metadata
            created_at          DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
            updated_at          DATETIMEOFFSET NULL,

            CONSTRAINT PK_mit_monitoring PRIMARY KEY (id),
            CONSTRAINT FK_mit_owner FOREIGN KEY (owner_account_id)
                REFERENCES app.account(id) ON DELETE SET NULL
        );
    """)


def downgrade() -> None:
    op.execute("IF OBJECT_ID('app.mit_monitoring', 'U') IS NOT NULL DROP TABLE app.mit_monitoring;")
