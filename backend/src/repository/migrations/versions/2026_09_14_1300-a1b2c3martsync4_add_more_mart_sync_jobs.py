"""add_more_mart_sync_jobs

Revision ID: a1b2c3martsync4
Revises: a1b2c3abiabo3
Create Date: 2026-09-14 13:00:00.000000

Log Data only tracked the original 10 modules from the first WhatsApp
screenshot. mart_pertamina actually has more tables with a clear 1:1
app-schema source: field_location (dimension table other synced tables
join against), HAZID, HAZOP, HSSE, both LCV tables, and now ABI/ABO
(built after the original mart_pertamina schema dump). Add jobs for all
of them.

field_location -> mart_pertamina.field runs first (sort_order 0):
HAZID/HAZOP/HSSE/LOPA/MOC's sync procs join against it by field code to
fill in SANDI_FIELD/idfield, so it needs fresh data before they run.

Still NOT addable to Log Data — no corresponding app-side source table
exists at all: mart_pertamina.produksi_gas_mmscfd / produksi_oil_bbls /
produksi_operasi_bopd / produksi_pupo_sot_bopd / produksi_target /
safemanhours (these are per-metric splits of app.produksi_monitoring's
wide format — a real ETL, not a 1:1 copy), psaims_monitoring (no
matching app module), and lcv_karyawan / lcv_pelatihan /
lcv_pesertaPelatihan (LCV training-tracking data with no app-side
upload path). Those need new app features before they can be compared
here.
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "a1b2c3martsync4"
down_revision = "a1b2c3abiabo3"
branch_labels = None
depends_on = None

_SEED_JOBS = [
    ("Field (dimensi)", "field_location", "field", "EXEC mart_pertamina.sp_sync_field;", 0),
    ("HAZID", "hazid_monitoring", "hazid", "EXEC mart_pertamina.sp_sync_hazid;", 11),
    ("HAZOP", "hazop_monitoring", "hazop", "EXEC mart_pertamina.sp_sync_hazop;", 12),
    ("HSSE", "hsse_monitoring", "hsse_izin_kerja", "EXEC mart_pertamina.sp_sync_hsse;", 13),
    ("LCV Project Charter Budaya", "lcv_project_charter_budaya", "LCV_projectCharterBudaya", "EXEC mart_pertamina.sp_sync_lcv_project_charter_budaya;", 14),
    ("LCV Monitoring", "lcv_monitoring", "Monitoring_LCV", "EXEC mart_pertamina.sp_sync_lcv_monitoring;", 15),
    ("ABI", "abi_monitoring", "abi", "EXEC mart_pertamina.sp_sync_abi;", 16),
    ("ABO", "abo_monitoring", "abo", "EXEC mart_pertamina.sp_sync_abo;", 17),
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
    names = [job[0] for job in _SEED_JOBS]
    for name in names:
        conn.execute(sa.text("DELETE FROM app.mart_sync_job WHERE name = :name"), {"name": name})
