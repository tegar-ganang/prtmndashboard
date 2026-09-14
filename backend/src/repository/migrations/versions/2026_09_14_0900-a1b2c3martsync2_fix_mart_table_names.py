"""fix_mart_table_names_in_mart_sync_job

Revision ID: a1b2c3martsync2
Revises: a1b2c3martsync1
Create Date: 2026-09-14 09:00:00.000000

Perubahan:
  - Perbaiki kolom mart_table di mart_sync_job. Waktu seed awal, mart_table
    ditebak sama dengan nama app_table (asumsi 1:1). Setelah lihat schema
    asli mart_pertamina dari prod, beberapa nama tabelnya beda:
      mit_monitoring    -> mit
      lopa_monitoring   -> lopa
      moc_monitoring    -> moc
      airms_monitoring  -> airms
      i2aims_monitoring -> i2aims
      zona_indicator    -> psa_zona_indicator
      zona_pse_list     -> psa_zona_pse
    (project, project_progress, project_progress_summary sudah cocok)
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "a1b2c3martsync2"
down_revision = "a1b2c3martsync1"
branch_labels = None
depends_on = None

_FIXES = {
    "MIT": "mit",
    "LOPA": "lopa",
    "MOC": "moc",
    "AIRMS": "airms",
    "I2AIMS": "i2aims",
    "PSA Zona Indicator": "psa_zona_indicator",
    "PSA Zona PSE List": "psa_zona_pse",
}


def upgrade() -> None:
    conn = op.get_bind()
    for name, mart_table in _FIXES.items():
        conn.execute(
            sa.text("UPDATE app.mart_sync_job SET mart_table = :mart_table WHERE name = :name"),
            {"mart_table": mart_table, "name": name},
        )


def downgrade() -> None:
    conn = op.get_bind()
    for name in _FIXES:
        # Restore the original (same-name-as-app_table) guess.
        conn.execute(
            sa.text("""
                UPDATE app.mart_sync_job
                SET mart_table = app_table
                WHERE name = :name
            """),
            {"name": name},
        )
