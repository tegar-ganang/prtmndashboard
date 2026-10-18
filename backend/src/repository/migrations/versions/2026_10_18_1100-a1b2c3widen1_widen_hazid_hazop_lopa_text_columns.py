"""widen text columns that silently truncated uploads

Revision ID: a1b2c3widen1
Revises: a1b2c3mittc1
Create Date: 2026-10-18 11:00:00.000000

The upload path cuts strings to the column length without warning. Real sheets
overflowed these: HAZOP CATEGORY (102 chars > 100), LOPA FINAL ELEMENT (333 > 255).
Mart counterparts are already NVARCHAR(MAX).
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "a1b2c3widen1"
down_revision = "a1b2c3mittc1"
branch_labels = None
depends_on = None

_COLUMNS = [
    ("hazid_monitoring", "category", "NVARCHAR(255)", "NVARCHAR(100)"),
    ("hazid_monitoring", "sub_category", "NVARCHAR(255)", "NVARCHAR(100)"),
    ("hazop_monitoring", "category", "NVARCHAR(255)", "NVARCHAR(100)"),
    ("hazop_monitoring", "sub_category", "NVARCHAR(255)", "NVARCHAR(100)"),
    ("lopa_monitoring", "final_element", "NVARCHAR(MAX)", "NVARCHAR(255)"),
]


def upgrade() -> None:
    for table, column, new_type, _ in _COLUMNS:
        op.execute(f"ALTER TABLE app.{table} ALTER COLUMN {column} {new_type} NULL;")


def downgrade() -> None:
    for table, column, _, old_type in _COLUMNS:
        length = old_type[old_type.index("(") + 1 : -1]
        op.execute(f"UPDATE app.{table} SET {column} = LEFT({column}, {length}) WHERE LEN({column}) > {length};")
        op.execute(f"ALTER TABLE app.{table} ALTER COLUMN {column} {old_type} NULL;")
