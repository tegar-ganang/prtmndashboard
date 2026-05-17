"""create field_location table and link monitoring tables

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-05-17 08:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "c3d4e5f6a7b8"
down_revision = "b2c3d4e5f6a7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Create `field_location` table in schema `app`
    op.execute("""
        IF OBJECT_ID('app.field_location', 'U') IS NULL
        BEGIN
            CREATE TABLE app.field_location (
                id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
                code        NVARCHAR(50) NOT NULL,
                name        NVARCHAR(100) NOT NULL,
                description NVARCHAR(255) NULL,
                created_at  DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
                updated_at  DATETIMEOFFSET NULL,
                CONSTRAINT PK_field_location PRIMARY KEY (id),
                CONSTRAINT UQ_field_location_code UNIQUE (code)
            );
        END
    """)

    # 2. Insert initial locations: DONGGI and MATINDOK
    op.execute("""
        IF NOT EXISTS (SELECT 1 FROM app.field_location WHERE code = 'DONGGI')
            INSERT INTO app.field_location (code, name, description) VALUES ('DONGGI', 'Donggi', 'Operational Field Donggi');
        IF NOT EXISTS (SELECT 1 FROM app.field_location WHERE code = 'MATINDOK')
            INSERT INTO app.field_location (code, name, description) VALUES ('MATINDOK', 'Matindok', 'Operational Field Matindok');
    """)

    # 3. Add foreign keys to the 4 monitoring tables
    op.execute("""
        IF OBJECT_ID('app.FK_mit_field', 'F') IS NULL
            ALTER TABLE app.mit_monitoring ADD CONSTRAINT FK_mit_field FOREIGN KEY (field) REFERENCES app.field_location(code);
            
        IF OBJECT_ID('app.FK_hazid_field', 'F') IS NULL
            ALTER TABLE app.hazid_monitoring ADD CONSTRAINT FK_hazid_field FOREIGN KEY (field) REFERENCES app.field_location(code);
            
        IF OBJECT_ID('app.FK_hazop_field', 'F') IS NULL
            ALTER TABLE app.hazop_monitoring ADD CONSTRAINT FK_hazop_field FOREIGN KEY (field) REFERENCES app.field_location(code);
            
        IF OBJECT_ID('app.FK_lopa_field', 'F') IS NULL
            ALTER TABLE app.lopa_monitoring ADD CONSTRAINT FK_lopa_field FOREIGN KEY (field) REFERENCES app.field_location(code);
    """)


def downgrade() -> None:
    # 1. Drop foreign keys
    op.execute("""
        IF OBJECT_ID('app.FK_mit_field', 'F') IS NOT NULL
            ALTER TABLE app.mit_monitoring DROP CONSTRAINT FK_mit_field;
            
        IF OBJECT_ID('app.FK_hazid_field', 'F') IS NOT NULL
            ALTER TABLE app.hazid_monitoring DROP CONSTRAINT FK_hazid_field;
            
        IF OBJECT_ID('app.FK_hazop_field', 'F') IS NOT NULL
            ALTER TABLE app.hazop_monitoring DROP CONSTRAINT FK_hazop_field;
            
        IF OBJECT_ID('app.FK_lopa_field', 'F') IS NOT NULL
            ALTER TABLE app.lopa_monitoring DROP CONSTRAINT FK_lopa_field;
    """)

    # 2. Drop `field_location` table
    op.execute("""
        IF OBJECT_ID('app.field_location', 'U') IS NOT NULL
            DROP TABLE app.field_location;
    """)
