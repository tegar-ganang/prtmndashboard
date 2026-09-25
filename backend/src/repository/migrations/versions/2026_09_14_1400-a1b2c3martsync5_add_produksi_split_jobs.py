"""add_produksi_split_mart_sync_jobs

Revision ID: a1b2c3martsync5
Revises: a1b2c3martsync4
Create Date: 2026-09-14 14:00:00.000000

These 5 mart tables aren't missing an app source after all — they're
just per-metric "long format" splits of columns that already live inside
app.produksi_monitoring / app.produksi_target (a wide, one-row-per-day
table). Column -> mart mapping:
  - produksi_gas_mmscfd     <- donggi_prod / matindok_prod
  - produksi_operasi_bopd   <- op_donggi / op_matindok
  - produksi_pupo_sot_bopd  <- pupo_sot_donggi / pupo_sot_matindok
  - safemanhours            <- safe_man_hours_actl
  - produksi_target (mart)  <- target_dmf (jenis=GAS) / target_kondensat
                                (jenis=KONDENSAT), jenis_target='RKAP'
                                (the only type the app currently produces)

Note: for the first three, each app.produksi_monitoring row fans out into
2 mart rows (one per field) — Log Data's app-vs-mart count for those will
legitimately show ~2x, not "Sesuai". That's expected, not a bug.

produksi_oil_bbls, psaims_monitoring, and the 3 lcv_* training tables are
NOT included here — still no confirmed 1:1 app source for those.
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "a1b2c3martsync5"
down_revision = "a1b2c3martsync4"
branch_labels = None
depends_on = None

_SEED_JOBS = [
    ("Produksi Gas MMSCFD", "produksi_monitoring", "produksi_gas_mmscfd", "EXEC mart_pertamina.sp_sync_produksi_gas_mmscfd;", 18),
    ("Produksi Operasi BOPD", "produksi_monitoring", "produksi_operasi_bopd", "EXEC mart_pertamina.sp_sync_produksi_operasi_bopd;", 19),
    ("Produksi PUPO/SOT BOPD", "produksi_monitoring", "produksi_pupo_sot_bopd", "EXEC mart_pertamina.sp_sync_produksi_pupo_sot_bopd;", 20),
    ("Safe Man Hours", "produksi_monitoring", "safemanhours", "EXEC mart_pertamina.sp_sync_safemanhours;", 21),
    ("Produksi Target", "produksi_target", "produksi_target", "EXEC mart_pertamina.sp_sync_produksi_target;", 22),
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
