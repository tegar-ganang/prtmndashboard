"""add_produksi_oil_bbls_mart_sync_job

Revision ID: a1b2c3martsync7
Revises: a1b2c3prodbbls1
Create Date: 2026-09-18 09:30:00.000000

produksi_oil_bbls now has a confirmed app source after all
(app.produksi_monitoring.bbls_*, added by a1b2c3prodbbls1) and a
sp_sync_produksi_oil_bbls procedure — register the mart_sync_job so it
shows up in Log Data like its 4 siblings.
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "a1b2c3martsync7"
down_revision = "a1b2c3prodbbls1"
branch_labels = None
depends_on = None

_SEED_JOBS = [
    ("Produksi Oil BBLS", "produksi_monitoring", "produksi_oil_bbls", "EXEC mart_pertamina.sp_sync_produksi_oil_bbls;", 27),
]


def upgrade() -> None:
    conn = op.get_bind()
    for name, app_table, mart_table, sync_script, sort_order in _SEED_JOBS:
        existing = conn.execute(
            sa.text("SELECT 1 FROM app.mart_sync_job WHERE name = :name"), {"name": name}
        ).fetchone()
        if existing:
            continue
        conn.execute(
            sa.text("""
                INSERT INTO app.mart_sync_job (id, name, app_table, mart_table, sync_script, sort_order, is_active)
                VALUES (NEWID(), :name, :app_table, :mart_table, :sync_script, :sort_order, 1)
            """),
            {
                "name": name,
                "app_table": app_table,
                "mart_table": mart_table,
                "sync_script": sync_script,
                "sort_order": sort_order,
            },
        )


def downgrade() -> None:
    conn = op.get_bind()
    for name, *_ in _SEED_JOBS:
        conn.execute(sa.text("DELETE FROM app.mart_sync_job WHERE name = :name"), {"name": name})
