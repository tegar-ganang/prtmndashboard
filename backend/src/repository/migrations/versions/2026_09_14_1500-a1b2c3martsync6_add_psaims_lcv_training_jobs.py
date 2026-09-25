"""add_psaims_and_lcv_training_mart_sync_jobs

Revision ID: a1b2c3martsync6
Revises: a1b2c3martsync5
Create Date: 2026-09-14 15:00:00.000000

User confirmed these ARE sourced from existing app modules under
different mart-side names:
  - psaims_monitoring        <- app.zona_indicator (same PSAIMS feature,
                                 different table shape; only realisasi
                                 side is populated, no plan/actual split
                                 exists in the app)
  - lcv_karyawan/lcv_pelatihan/lcv_pesertaPelatihan
                             <- app.lcv_monitoring (FK-linked trio,
                                 rebuilt together by one shared procedure,
                                 sp_sync_lcv_training)

lcv_pelatihan's "app count" won't be comparable — it's a fixed 5-row
training-type catalog, not a per-row mirror of lcv_monitoring.

produksi_oil_bbls confirmed by the user to have no app-side source at
all — intentionally still not added.
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "a1b2c3martsync6"
down_revision = "a1b2c3martsync5"
branch_labels = None
depends_on = None

_SEED_JOBS = [
    ("PSAIMS Monitoring", "zona_indicator", "psaims_monitoring", "EXEC mart_pertamina.sp_sync_psaims_monitoring;", 23),
    ("LCV Karyawan", "lcv_monitoring", "lcv_karyawan", "EXEC mart_pertamina.sp_sync_lcv_training;", 24),
    ("LCV Pelatihan", "lcv_monitoring", "lcv_pelatihan", "EXEC mart_pertamina.sp_sync_lcv_training;", 25),
    ("LCV Peserta Pelatihan", "lcv_monitoring", "lcv_pesertaPelatihan", "EXEC mart_pertamina.sp_sync_lcv_training;", 26),
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
