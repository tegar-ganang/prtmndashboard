"""create_mart_sync_job_table

Revision ID: a1b2c3martsync1
Revises: a1b2c3prodkon1
Create Date: 2026-09-13 11:00:00.000000

Perubahan:
  - Buat tabel app.mart_sync_job — dipakai halaman admin "Log Data" untuk
    (1) membandingkan jumlah baris schema app vs schema mart_pertamina, dan
    (2) tombol "Sync Data" yang menjalankan tiap sync_script berurutan.
  - Seed 10 baris awal sesuai daftar script yang sudah berjalan manual.

Note: mart_table diisi tebakan awal (nama sama dengan app_table). Jika nama
tabel di schema mart_pertamina berbeda, tinggal UPDATE kolom mart_table —
tidak perlu migration baru.
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "a1b2c3martsync1"
down_revision = "a1b2c3prodkon1"
branch_labels = None
depends_on = None

_SEED_JOBS = [
    ("Project", "project", "project", "EXEC mart_pertamina.sp_sync_project;", 1),
    ("Project Progress", "project_progress", "project_progress", "EXEC mart_pertamina.usp_MigrateProjectProgressData;", 2),
    ("Project Progress Summary", "project_progress_summary", "project_progress_summary", "EXEC mart_pertamina.usp_MigrateProjectProgressSummary;", 3),
    ("PSA Zona Indicator", "zona_indicator", "zona_indicator", "EXEC mart_pertamina.sp_sync_psa_zona_indicator;", 4),
    ("PSA Zona PSE List", "zona_pse_list", "zona_pse_list", "EXEC mart_pertamina.sp_sync_psa_zona_indicator;", 5),
    ("MIT", "mit_monitoring", "mit_monitoring", "EXEC mart_pertamina.sp_sync_mit;", 6),
    ("LOPA", "lopa_monitoring", "lopa_monitoring", "EXEC mart_pertamina.sp_sync_lopa;", 7),
    ("MOC", "moc_monitoring", "moc_monitoring", "EXEC mart_pertamina.sp_sync_moc;", 8),
    ("AIRMS", "airms_monitoring", "airms_monitoring", "EXEC mart_pertamina.sp_sync_airms;", 9),
    ("I2AIMS", "i2aims_monitoring", "i2aims_monitoring", "EXEC mart_pertamina.sp_sync_i2aims;", 10),
]


def upgrade() -> None:
    op.execute("""
        IF OBJECT_ID('app.mart_sync_job', 'U') IS NULL
        BEGIN
            CREATE TABLE app.mart_sync_job (
                id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
                name            NVARCHAR(100)    NOT NULL,
                app_table       NVARCHAR(128)    NOT NULL,
                mart_table      NVARCHAR(128)    NOT NULL,
                sync_script     NVARCHAR(MAX)    NOT NULL,
                sort_order      INT              NOT NULL DEFAULT 0,
                is_active       BIT              NOT NULL DEFAULT 1,
                created_at      DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
                updated_at      DATETIMEOFFSET   NULL,

                CONSTRAINT PK_mart_sync_job PRIMARY KEY (id)
            );
        END
    """)

    conn = op.get_bind()
    existing = conn.execute(sa.text("SELECT COUNT(*) FROM app.mart_sync_job")).scalar_one()
    if existing == 0:
        for name, app_table, mart_table, sync_script, sort_order in _SEED_JOBS:
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
    op.execute("""
        IF OBJECT_ID('app.mart_sync_job', 'U') IS NOT NULL
            DROP TABLE app.mart_sync_job;
    """)
