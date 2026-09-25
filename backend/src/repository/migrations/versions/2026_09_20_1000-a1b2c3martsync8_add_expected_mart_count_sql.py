"""add_expected_mart_count_sql_to_mart_sync_job

Revision ID: a1b2c3martsync8
Revises: a1b2c3martsync7
Create Date: 2026-09-20 10:00:00.000000

Log Data compared app vs mart row counts for equality, which is always
"Selisih" for jobs where the mart table is a long-format split of a wide app
table (produksi_*) or a fixed catalog (lcv_pelatihan). expected_mart_count_sql
is an optional scalar query returning the mart row count we expect after a
correct sync; when NULL the app table count is used as before.
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "a1b2c3martsync8"
down_revision = "a1b2c3martsync7"
branch_labels = None
depends_on = None


def _unpivot_count(cols: list[str], table: str = "app.produksi_monitoring") -> str:
    values = ", ".join(f"(p.{c})" for c in cols)
    return (
        f"SELECT COUNT(*) FROM {table} p CROSS APPLY (VALUES {values}) v(x) WHERE v.x IS NOT NULL"
    )


_GAS_COLS = [f"{f}_{m}" for f in ("donggi", "matindok") for m in
             ("prod", "own_use", "sales", "main_flare", "acid_flare", "venting_co2", "losses")]

_LCV_TRAINING_COLS = ["training_isec", "training_lcv", "trainining_virtualdemoroomhsse",
                      "training_stressmanagement", "training_fraudawareness"]
_LCV_PESERTA = (
    "SELECT COUNT(*) FROM ("
    "SELECT m.*, ROW_NUMBER() OVER (PARTITION BY m.nip ORDER BY TRY_CAST(m.tahun AS INT) DESC) AS rn "
    "FROM app.lcv_monitoring m WHERE m.nip IS NOT NULL) p "
    "CROSS APPLY (VALUES " + ", ".join(f"(p.{c})" for c in _LCV_TRAINING_COLS) + ") v(x) "
    "WHERE p.rn = 1 AND v.x IS NOT NULL"
)

_EXPECTED = {
    "produksi_gas_mmscfd": _unpivot_count(_GAS_COLS),
    "produksi_operasi_bopd": _unpivot_count(["op_donggi", "op_matindok", "op_target", "op_real"]),
    "produksi_pupo_sot_bopd": _unpivot_count(["pupo_sot_donggi", "pupo_sot_matindok", "pupo_sot_target", "pupo_sot_real"]),
    "produksi_oil_bbls": _unpivot_count(["bbls_processed_water", "bbls_water_injection", "bbls_closing_stock", "bbls_actl"]),
    "safemanhours": "SELECT COUNT(safe_man_hours_dmf) FROM app.produksi_monitoring",
    "lcv_karyawan": "SELECT COUNT(DISTINCT nip) FROM app.lcv_monitoring WHERE nip IS NOT NULL",
    "lcv_pelatihan": "SELECT 5",
    "lcv_pesertaPelatihan": _LCV_PESERTA,
}


def upgrade() -> None:
    op.execute("""
        IF NOT EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'app' AND TABLE_NAME = 'mart_sync_job'
              AND COLUMN_NAME = 'expected_mart_count_sql'
        )
        ALTER TABLE app.mart_sync_job ADD expected_mart_count_sql NVARCHAR(MAX) NULL;
    """)
    conn = op.get_bind()
    for mart_table, sql in _EXPECTED.items():
        conn.execute(
            sa.text("UPDATE app.mart_sync_job SET expected_mart_count_sql = :sql WHERE mart_table = :t"),
            {"sql": sql, "t": mart_table},
        )


def downgrade() -> None:
    op.execute("""
        IF EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'app' AND TABLE_NAME = 'mart_sync_job'
              AND COLUMN_NAME = 'expected_mart_count_sql'
        )
        ALTER TABLE app.mart_sync_job DROP COLUMN expected_mart_count_sql;
    """)
