"""drop and recreate produksi_monitoring table with full column set

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-05-29 13:35:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "d4e5f6a7b8c9"
down_revision = "c3d4e5f6a7b8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop existing table (no data to preserve — approved by team)
    op.execute(
        "IF OBJECT_ID('app.produksi_monitoring', 'U') IS NOT NULL "
        "DROP TABLE app.produksi_monitoring;"
    )

    op.execute("""
        CREATE TABLE app.produksi_monitoring (
            id                  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
            upload_batch_id     UNIQUEIDENTIFIER NOT NULL,
            owner_account_id    UNIQUEIDENTIFIER NULL,

            -- Period Tracking
            reporting_year      INT              NOT NULL,
            reporting_month     SMALLINT         NOT NULL,
            field               VARCHAR(50)      NULL,

            -- Sheet 1: Tanggal
            tanggal             DATE             NOT NULL,

            -- Sheet 1: ANGKA PRODUKSI PUPO / SOT (BOPD)
            pupo_sot_target     DECIMAL(15, 4)   NULL,
            pupo_sot_real       DECIMAL(15, 4)   NULL,
            pupo_sot_donggi     DECIMAL(15, 4)   NULL,
            pupo_sot_matindok   DECIMAL(15, 4)   NULL,

            -- Sheet 1: ANGKA PRODUKSI OPERASI (BOPD)
            op_target           DECIMAL(15, 4)   NULL,
            op_real             DECIMAL(15, 4)   NULL,
            op_donggi           DECIMAL(15, 4)   NULL,
            op_matindok         DECIMAL(15, 4)   NULL,

            -- Sheet 1: PRODUKSI GAS MMSCFD - DONGGI FIELD
            donggi_prod         DECIMAL(15, 4)   NULL,
            donggi_own_use      DECIMAL(15, 4)   NULL,
            donggi_sales        DECIMAL(15, 4)   NULL,
            donggi_main_flare   DECIMAL(15, 4)   NULL,
            donggi_acid_flare   DECIMAL(15, 4)   NULL,
            donggi_venting_co2  DECIMAL(15, 4)   NULL,
            donggi_losses       DECIMAL(15, 4)   NULL,

            -- Sheet 1: PRODUKSI GAS MMSCFD - MATINDOK FIELD
            matindok_prod         DECIMAL(15, 4) NULL,
            matindok_own_use      DECIMAL(15, 4) NULL,
            matindok_sales        DECIMAL(15, 4) NULL,
            matindok_main_flare   DECIMAL(15, 4) NULL,
            matindok_acid_flare   DECIMAL(15, 4) NULL,
            matindok_venting_co2  DECIMAL(15, 4) NULL,
            matindok_losses       DECIMAL(15, 4) NULL,

            -- Sheet 1: BBLS - DONGGI MATINDOK FIELD
            bbls_processed_water  DECIMAL(15, 4) NULL,
            bbls_water_injection  DECIMAL(15, 4) NULL,
            bbls_closing_stock    DECIMAL(15, 4) NULL,

            -- Sheet 1: SAFE MAN HOURS
            safe_man_hours_actl   DECIMAL(15, 4) NULL,
            safe_man_hours_dmf    DECIMAL(15, 4) NULL,

            -- Injected from Sheet 2 (Target Bulanan)
            target_dmf            DECIMAL(15, 4) NULL,

            -- Metadata
            created_at          DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
            updated_at          DATETIMEOFFSET   NULL,

            CONSTRAINT PK_produksi_monitoring PRIMARY KEY (id),
            CONSTRAINT FK_produksi_owner FOREIGN KEY (owner_account_id)
                REFERENCES app.account(id) ON DELETE SET NULL
        );
    """)

    # Add FK for field separately (matching pattern of other monitoring tables)
    op.execute("""
        IF OBJECT_ID('app.FK_produksi_field', 'F') IS NULL
            ALTER TABLE app.produksi_monitoring
            ADD CONSTRAINT FK_produksi_field
            FOREIGN KEY (field) REFERENCES app.field_location(code);
    """)

    # Useful indexes
    op.execute("""
        CREATE INDEX IX_produksi_year_month_field
        ON app.produksi_monitoring (reporting_year, reporting_month, field);
    """)

    op.execute("""
        CREATE INDEX IX_produksi_tanggal
        ON app.produksi_monitoring (tanggal);
    """)

    op.execute("""
        CREATE INDEX IX_produksi_batch
        ON app.produksi_monitoring (upload_batch_id);
    """)


def downgrade() -> None:
    op.execute(
        "IF OBJECT_ID('app.produksi_monitoring', 'U') IS NOT NULL "
        "DROP TABLE app.produksi_monitoring;"
    )
