"""move_produksi_oil_bbls_before_safe_man_hours

Revision ID: a1b2c3martsync9
Revises: a1b2c3martsync8
Create Date: 2026-09-20 11:00:00.000000

Log Data lists jobs by sort_order; keep Produksi Oil BBLS grouped with the
other produksi_* jobs (right before Safe Man Hours) instead of at the end.
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "a1b2c3martsync9"
down_revision = "a1b2c3martsync8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        UPDATE app.mart_sync_job
        SET sort_order = CASE WHEN sort_order = 27 THEN 21 ELSE sort_order + 1 END
        WHERE sort_order BETWEEN 21 AND 27
    """)


def downgrade() -> None:
    op.execute("""
        UPDATE app.mart_sync_job
        SET sort_order = CASE WHEN sort_order = 21 THEN 27 ELSE sort_order - 1 END
        WHERE sort_order BETWEEN 21 AND 27
    """)
