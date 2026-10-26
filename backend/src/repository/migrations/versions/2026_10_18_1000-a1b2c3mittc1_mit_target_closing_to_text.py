"""mit_monitoring.target_closing DATE -> NVARCHAR(255)

Revision ID: a1b2c3mittc1
Revises: a1b2c3prodclean1
Create Date: 2026-10-18 10:00:00.000000

The MIT sheet's "Target Closing" holds free text ("TAR 2027", "TBC", "Q4 2025",
multi-line per-recommendation lists), which parse_date silently turned into NULL.
Existing DATE values convert to 'yyyy-mm-dd' strings.
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "a1b2c3mittc1"
down_revision = "a1b2c3prodclean1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE app.mit_monitoring ALTER COLUMN target_closing NVARCHAR(255) NULL;")


def downgrade() -> None:
    # Text that isn't a date can't go back into a DATE column.
    op.execute("UPDATE app.mit_monitoring SET target_closing = NULL WHERE TRY_CONVERT(DATE, target_closing) IS NULL;")
    op.execute("ALTER TABLE app.mit_monitoring ALTER COLUMN target_closing DATE NULL;")
