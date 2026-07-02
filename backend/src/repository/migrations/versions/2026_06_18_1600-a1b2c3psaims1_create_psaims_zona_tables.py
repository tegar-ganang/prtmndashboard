"""create psaims zona_indicator and zona_pse_list tables

Revision ID: a1b2c3psaims1
Revises: f6a7b8c9d0e1
Create Date: 2026-06-18 16:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "a1b2c3psaims1"
down_revision = "f6a7b8c9d0e1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── zona_indicator ──────────────────────────────────────────────────────────
    op.execute("""
        IF OBJECT_ID('app.FK_zona_indicator_owner', 'F') IS NOT NULL
            ALTER TABLE app.zona_indicator DROP CONSTRAINT FK_zona_indicator_owner;
    """)
    op.execute("IF OBJECT_ID('app.zona_indicator', 'U') IS NOT NULL DROP TABLE app.zona_indicator;")

    op.execute("""
        CREATE TABLE app.zona_indicator (
            id                  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
            upload_batch_id     UNIQUEIDENTIFIER NOT NULL,
            owner_account_id    UNIQUEIDENTIFIER NULL,

            -- Period Tracking
            reporting_year      INT              NOT NULL,
            zona                NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,

            -- Indicator Info
            ind_type            NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            indicator           NVARCHAR(500)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            unit                NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            description         NVARCHAR(MAX)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            basis               NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            pic_name            NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            pic_email           NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,

            -- Monthly Values
            jan                 FLOAT            NULL,
            feb                 FLOAT            NULL,
            mar                 FLOAT            NULL,
            apr                 FLOAT            NULL,
            may                 FLOAT            NULL,
            jun                 FLOAT            NULL,
            jul                 FLOAT            NULL,
            aug                 FLOAT            NULL,
            sep                 FLOAT            NULL,
            oct                 FLOAT            NULL,
            nov                 FLOAT            NULL,
            dec                 FLOAT            NULL,
            ytd                 FLOAT            NULL,
            comment             NVARCHAR(MAX)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,

            -- Metadata
            created_at          DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
            updated_at          DATETIMEOFFSET   NULL,

            CONSTRAINT PK_zona_indicator PRIMARY KEY (id),
            CONSTRAINT FK_zona_indicator_owner FOREIGN KEY (owner_account_id)
                REFERENCES app.account(id) ON DELETE SET NULL
        );
    """)

    op.execute("""
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_zona_indicator_period'
                       AND object_id = OBJECT_ID('app.zona_indicator'))
        CREATE INDEX IX_zona_indicator_period ON app.zona_indicator (reporting_year, zona);
    """)
    op.execute("""
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_zona_indicator_batch'
                       AND object_id = OBJECT_ID('app.zona_indicator'))
        CREATE INDEX IX_zona_indicator_batch ON app.zona_indicator (upload_batch_id);
    """)

    # ── zona_pse_list ───────────────────────────────────────────────────────────
    op.execute("""
        IF OBJECT_ID('app.FK_zona_pse_list_owner', 'F') IS NOT NULL
            ALTER TABLE app.zona_pse_list DROP CONSTRAINT FK_zona_pse_list_owner;
    """)
    op.execute("IF OBJECT_ID('app.zona_pse_list', 'U') IS NOT NULL DROP TABLE app.zona_pse_list;")

    op.execute("""
        CREATE TABLE app.zona_pse_list (
            id                          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
            upload_batch_id             UNIQUEIDENTIFIER NOT NULL,
            owner_account_id            UNIQUEIDENTIFIER NULL,

            -- Period Tracking
            reporting_year              INT              NOT NULL,
            reporting_month             SMALLINT         NOT NULL,
            zona                        NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,

            -- General Data
            no                          NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            field_area                  NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            lokasi                      NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            unit_detail                 NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            short_description           NVARCHAR(MAX)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            event_issue_category        NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            activity                    NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            type_location               NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            date_start                  DATE             NULL,
            time_start                  NVARCHAR(20)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,

            -- Barrier / LOPC
            barrier_prevent             NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            barrier_mitigate            NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            lopc_released               NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            lopc_duration_hour          FLOAT            NULL,
            lopc_flammable_gas_kg       FLOAT            NULL,
            lopc_gas_one_hour_kg        FLOAT            NULL,
            liquid_hc_type              NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            lopc_hc_liquid_barrel       FLOAT            NULL,
            lopc_hc_liquid_one_hour_kg  FLOAT            NULL,
            toxic_type                  NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            lopc_toxic_kg               FLOAT            NULL,
            lopc_toxic_one_hour_kg      FLOAT            NULL,
            other_type                  NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            lopc_other_kg               FLOAT            NULL,
            lopc_other_one_hour_kg      FLOAT            NULL,

            -- Injury / Damage
            injured_worker              NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            affect_3rd_party            NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            number_injured_person       INT              NULL,
            number_fatality             INT              NULL,
            fire_explosion              NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            damage_fire_explosion_usd   FLOAT            NULL,

            -- Relief Device
            relief_device               NVARCHAR(100)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            effect_relief_device        NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            pse_tier                    NVARCHAR(50)     COLLATE SQL_Latin1_General_CP1_CI_AS NULL,

            -- Causal Factors
            causal_1_desc               NVARCHAR(MAX)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            causal_1_category           NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            causal_1_sub_category       NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            causal_2_desc               NVARCHAR(MAX)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            causal_2_category           NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            causal_2_sub_category       NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            causal_3_desc               NVARCHAR(MAX)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            causal_3_category           NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            causal_3_sub_category       NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,

            -- Barrier Failures
            barrier_1_desc              NVARCHAR(MAX)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            barrier_1_category          NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            barrier_1_sub_category      NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            barrier_2_desc              NVARCHAR(MAX)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            barrier_2_category          NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            barrier_2_sub_category      NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            barrier_3_desc              NVARCHAR(MAX)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            barrier_3_category          NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
            barrier_3_sub_category      NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,

            remarks                     NVARCHAR(MAX)    COLLATE SQL_Latin1_General_CP1_CI_AS NULL,

            -- Metadata
            created_at                  DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
            updated_at                  DATETIMEOFFSET   NULL,

            CONSTRAINT PK_zona_pse_list PRIMARY KEY (id),
            CONSTRAINT FK_zona_pse_list_owner FOREIGN KEY (owner_account_id)
                REFERENCES app.account(id) ON DELETE SET NULL
        );
    """)

    op.execute("""
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_zona_pse_list_period'
                       AND object_id = OBJECT_ID('app.zona_pse_list'))
        CREATE INDEX IX_zona_pse_list_period ON app.zona_pse_list (reporting_year, reporting_month, zona);
    """)
    op.execute("""
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_zona_pse_list_batch'
                       AND object_id = OBJECT_ID('app.zona_pse_list'))
        CREATE INDEX IX_zona_pse_list_batch ON app.zona_pse_list (upload_batch_id);
    """)


def downgrade() -> None:
    op.execute("IF OBJECT_ID('app.zona_pse_list', 'U') IS NOT NULL DROP TABLE app.zona_pse_list;")
    op.execute("IF OBJECT_ID('app.zona_indicator', 'U') IS NOT NULL DROP TABLE app.zona_indicator;")
