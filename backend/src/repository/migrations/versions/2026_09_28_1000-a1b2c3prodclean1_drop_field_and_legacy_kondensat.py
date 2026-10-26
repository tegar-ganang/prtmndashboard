"""drop_field_and_legacy_kondensat_from_produksi

Revision ID: a1b2c3prodclean1
Revises: a1b2c3martsync10
Create Date: 2026-09-28 10:00:00.000000

Two columns cleaned up on app.produksi_monitoring / app.produksi_target:

  - `field`: always NULL on both tables. Neither upload path (Data Gathering,
    the dedicated Produksi upload page) has ever sent it — one sheet covers
    Donggi and Matindok together, split by column, not by a per-row field.
    Other monitoring tables (MIT, HAZID, ...) still use `field` normally;
    only these two are dropped.
  - `target_kondensat` (produksi_target): the pre-WP&B-split column,
    superseded by `target_kondensat_rkap`. Before dropping it, backfill any
    row where it still holds a value that never made it into
    target_kondensat_rkap (old-format uploads, or rows created before
    a1b2c3prodwpb1) — same KPI, just under the old column name.

Note: the FK constraint on `field` is not reliably named the same everywhere —
tables built by `create_all()` (master) get a SQL Server auto-generated name,
while ones built through the earlier migrations got the explicit name below
(and staging, having gone through both paths at different times, ended up
with both). `_drop_fk_on_column` finds and drops whichever name(s) exist on
that column instead of assuming one.
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "a1b2c3prodclean1"
down_revision = "a1b2c3martsync10"
branch_labels = None
depends_on = None

# Drops every FK constraint currently sitting on `app.<table>.<column>`, whatever it's named —
# see the module docstring. Loops because a column can end up with more than one (staging did).
_DROP_FK_ON_COLUMN = """
DECLARE @fk NVARCHAR(200);
WHILE EXISTS (
    SELECT 1 FROM sys.foreign_key_columns fkc
    JOIN sys.tables t ON t.object_id = fkc.parent_object_id
    JOIN sys.columns c ON c.object_id = fkc.parent_object_id AND c.column_id = fkc.parent_column_id
    WHERE t.name = '{table}' AND c.name = '{column}'
)
BEGIN
    SELECT TOP 1 @fk = fk.name
    FROM sys.foreign_keys fk
    JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
    JOIN sys.tables t ON t.object_id = fkc.parent_object_id
    JOIN sys.columns c ON c.object_id = fkc.parent_object_id AND c.column_id = fkc.parent_column_id
    WHERE t.name = '{table}' AND c.name = '{column}';
    EXEC('ALTER TABLE app.{table} DROP CONSTRAINT ' + @fk);
END
"""


def _drop_fk_on_column(table: str, column: str) -> None:
    op.execute(_DROP_FK_ON_COLUMN.format(table=table, column=column))


def _drop_column(table: str, column: str) -> None:
    op.execute(f"""
        IF EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'app' AND TABLE_NAME = '{table}' AND COLUMN_NAME = '{column}'
        )
        ALTER TABLE app.{table} DROP COLUMN {column};
    """)


def _replace_index(table: str, old_name: str, new_name: str, new_cols: str) -> None:
    """Drop a (year, month, field) index and replace it with one on (year, month) only.
    `field` is part of `old_name` on staging; master never had this index (guards handle both)."""
    op.execute(f"""
        IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = '{old_name}' AND object_id = OBJECT_ID('app.{table}'))
            DROP INDEX {old_name} ON app.{table};
    """)
    op.execute(f"""
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = '{new_name}' AND object_id = OBJECT_ID('app.{table}'))
            CREATE INDEX {new_name} ON app.{table} ({new_cols});
    """)


def upgrade() -> None:
    op.execute("""
        UPDATE app.produksi_target
        SET target_kondensat_rkap = target_kondensat
        WHERE target_kondensat_rkap IS NULL AND target_kondensat IS NOT NULL;
    """)

    _replace_index("produksi_target", "IX_produksi_target_year_month_field",
                    "IX_produksi_target_year_month", "reporting_year, reporting_month")
    _drop_fk_on_column("produksi_target", "field")
    _drop_column("produksi_target", "field")
    _drop_column("produksi_target", "target_kondensat")

    _replace_index("produksi_monitoring", "IX_produksi_year_month_field",
                    "IX_produksi_year_month", "reporting_year, reporting_month")
    _drop_fk_on_column("produksi_monitoring", "field")
    _drop_column("produksi_monitoring", "field")


def downgrade() -> None:
    # Schema-only reversal: target_kondensat's old values were merged into
    # target_kondensat_rkap and are not split back out (that merge is one-way).
    op.execute("""
        IF NOT EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'app' AND TABLE_NAME = 'produksi_target' AND COLUMN_NAME = 'field'
        )
        ALTER TABLE app.produksi_target ADD field VARCHAR(50) NULL;
    """)
    op.execute("""
        IF NOT EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'app' AND TABLE_NAME = 'produksi_target' AND COLUMN_NAME = 'target_kondensat'
        )
        ALTER TABLE app.produksi_target ADD target_kondensat DECIMAL(15, 4) NULL;
    """)
    op.execute("""
        IF OBJECT_ID('app.FK_produksi_target_field', 'F') IS NULL
            ALTER TABLE app.produksi_target
            ADD CONSTRAINT FK_produksi_target_field
            FOREIGN KEY (field) REFERENCES app.field_location(code);
    """)
    _replace_index("produksi_target", "IX_produksi_target_year_month",
                    "IX_produksi_target_year_month_field", "reporting_year, reporting_month, field")

    op.execute("""
        IF NOT EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'app' AND TABLE_NAME = 'produksi_monitoring' AND COLUMN_NAME = 'field'
        )
        ALTER TABLE app.produksi_monitoring ADD field VARCHAR(50) NULL;
    """)
    op.execute("""
        IF OBJECT_ID('app.FK_produksi_field', 'F') IS NULL
            ALTER TABLE app.produksi_monitoring
            ADD CONSTRAINT FK_produksi_field
            FOREIGN KEY (field) REFERENCES app.field_location(code);
    """)
    _replace_index("produksi_monitoring", "IX_produksi_year_month",
                    "IX_produksi_year_month_field", "reporting_year, reporting_month, field")
