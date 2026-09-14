"""fix_project_progress_target_and_pse_script

Revision ID: a1b2c3martsync3
Revises: a1b2c3martsync2
Create Date: 2026-09-14 10:00:00.000000

Perubahan:
  - "Project Progress" job: mart_table diperbaiki dari `project_progress`
    jadi `project_progress_v2` — setelah dibandingkan langsung, kolom
    project_progress_v2 cocok persis dengan app.project_progress (UUID
    project_id, item_no), sedangkan project_progress polos punya bentuk
    lain (bigint project_id, activities_id) dari desain lama.
  - "PSA Zona PSE List" job: sync_script diperbaiki dari
    "EXEC mart_pertamina.sp_sync_psa_zona_indicator;" (duplikat salah
    copy-paste dari job PSA Zona Indicator) jadi memanggil stored
    procedure barunya sendiri, sp_sync_psa_zona_pse.
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "a1b2c3martsync3"
down_revision = "a1b2c3martsync2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("""
        UPDATE app.mart_sync_job
        SET mart_table = 'project_progress_v2'
        WHERE name = 'Project Progress'
    """))
    conn.execute(sa.text("""
        UPDATE app.mart_sync_job
        SET sync_script = 'EXEC mart_pertamina.sp_sync_psa_zona_pse;'
        WHERE name = 'PSA Zona PSE List'
    """))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("""
        UPDATE app.mart_sync_job
        SET mart_table = 'project_progress'
        WHERE name = 'Project Progress'
    """))
    conn.execute(sa.text("""
        UPDATE app.mart_sync_job
        SET sync_script = 'EXEC mart_pertamina.sp_sync_psa_zona_indicator;'
        WHERE name = 'PSA Zona PSE List'
    """))
