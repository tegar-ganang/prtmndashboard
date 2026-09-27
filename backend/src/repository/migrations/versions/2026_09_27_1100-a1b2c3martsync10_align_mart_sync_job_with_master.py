"""align_mart_sync_job_with_master

Revision ID: a1b2c3martsync10
Revises: a1b2c3prodwpb1
Create Date: 2026-09-27 11:00:00.000000

Seeding brought mart_sync_job to a different state than the `master` database, where
expected counts were hand-tuned and jobs without a working SP were removed. This migration
makes a freshly seeded DB (and an existing one) match master's export
`mart_sync_job_202609270718.csv`:

  - expected_mart_count_sql for the produksi_* / safemanhours / produksi_target jobs is
    replaced by the versions tuned against master's stored procedures (keyed by mart_table,
    like martsync8).
  - jobs that are not in master's list are kept but disabled (is_active = 0) instead of
    deleted, so the Log Data page skips them and they can be switched back on later.

Not touched: sync_script / mart_table of the other jobs. Master repoints HSSE and LCV Monitoring
to its own SPs (sp_sync_hsse_izin_kerja, sp_sync_lcv); the repo drafts keep sp_sync_hsse and
sp_sync_lcv_monitoring. Rows missing in a DB (deleted by hand) are not re-created here.
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "a1b2c3martsync10"
down_revision = "a1b2c3prodwpb1"
branch_labels = None
depends_on = None

_EXPECTED = {
    "produksi_gas_mmscfd": """
select count(*) from (

select 
	pm.tanggal 
	, 1 as sandifield
	, pm.donggi_prod jumlah
	, 'PROD' keterangan
from app.produksi_monitoring pm 
where pm.donggi_prod is not null

union all

select 
	pm.tanggal 
	, 1 as sandifield
	, pm.donggi_own_use jumlah
	, 'OWN USE' keterangan
from app.produksi_monitoring pm 
where pm.donggi_own_use is not null

union all

select 
	pm.tanggal 
	, 1 as sandifield
	, pm.donggi_sales jumlah
	, 'SALES' keterangan
from app.produksi_monitoring pm 
where pm.donggi_sales is not null

union all

select 
	pm.tanggal 
	, 1 as sandifield
	, pm.donggi_main_flare jumlah
	, 'MAIN FLARE' keterangan
from app.produksi_monitoring pm 
where pm.donggi_main_flare is not null

union all

select 
	pm.tanggal 
	, 1 as sandifield
	, pm.donggi_acid_flare jumlah
	, 'ACID FLARE' keterangan
from app.produksi_monitoring pm 
where pm.donggi_acid_flare is not null

union all

select 
	pm.tanggal 
	, 1 as sandifield
	, pm.donggi_venting_co2 jumlah
	, 'VENTING CO2' keterangan
from app.produksi_monitoring pm 
where pm.donggi_venting_co2 is not null

union all

select 
	pm.tanggal 
	, 1 as sandifield
	, pm.donggi_losses jumlah
	, 'LOSSES' keterangan
from app.produksi_monitoring pm 
where pm.donggi_losses is not null
union all
select 
	pm.tanggal 
	, 2 as sandifield
	, pm.matindok_prod jumlah
	, 'PROD' keterangan
from app.produksi_monitoring pm 
where pm.matindok_prod  is not null

union all

select 
	pm.tanggal 
	, 2 as sandifield
	, pm.matindok_own_use jumlah
	, 'OWN USE' keterangan
from app.produksi_monitoring pm 
where pm.matindok_own_use  is not null

union all

select 
	pm.tanggal 
	, 2 as sandifield
	, pm.matindok_sales jumlah
	, 'SALES' keterangan
from app.produksi_monitoring pm 
where pm.matindok_sales  is not null

union all

select 
	pm.tanggal 
	, 2 as sandifield
	, pm.matindok_main_flare jumlah
	, 'MAIN FLARE' keterangan
from app.produksi_monitoring pm 
where pm.matindok_main_flare  is not null

union all

select 
	pm.tanggal 
	, 2 as sandifield
	, pm.matindok_acid_flare jumlah
	, 'ACID FLARE' keterangan
from app.produksi_monitoring pm 
where pm.matindok_acid_flare  is not null

union all

select 
	pm.tanggal 
	, 2 as sandifield
	, pm.matindok_venting_co2  jumlah
	, 'VENTING CO2' keterangan
from app.produksi_monitoring pm 
where pm.matindok_venting_co2 is not null

union all

select 
	pm.tanggal 
	, 2 as sandifield
	, pm.matindok_losses  jumlah
	, 'LOSSES' keterangan
from app.produksi_monitoring pm 
where pm.matindok_losses is not null) b
""",
    "produksi_operasi_bopd": """
select count(*) from (

select 
	pm.tanggal 
	, 3 as sandifield
	, pm.op_target jumlah
	, 'TARGET' keterangan
from app.produksi_monitoring pm 

union all

select 
	pm.tanggal 
	, 1 as sandifield
	, pm.op_donggi jumlah
	, NULL keterangan
from app.produksi_monitoring pm 

union all

select 
	pm.tanggal 
	, 2 as sandifield
	, pm.op_matindok jumlah
	, NULL keterangan
from app.produksi_monitoring pm 
) b
;
""",
    "produksi_pupo_sot_bopd": """
select count(*) from(
select 
	pm.tanggal 
	, 3 as sandifield
	, pm.pupo_sot_target jumlah
	, 'TARGET' keterangan
from app.produksi_monitoring pm 

union all

select 
	pm.tanggal 
	, 1 as sandifield
	, pm.pupo_sot_donggi jumlah
	, NULL keterangan
from app.produksi_monitoring pm 

union all

select 
	pm.tanggal 
	, 2 as sandifield
	, pm.pupo_sot_matindok jumlah
	, NULL keterangan
from app.produksi_monitoring pm 
) b;
""",
    "produksi_oil_bbls": """
select count(*) from (
select 
	pm.tanggal 
	, 3 as sandifield
	, pm.bbls_processed_water jumlah
	, 'PROCESSED & PRODUCED WATER' keterangan
from app.produksi_monitoring pm 
where pm.bbls_processed_water is not null

union all

select 
	pm.tanggal 
	, 3 as sandifield
	, pm.bbls_water_injection jumlah
	, 'WATER INJECTION' keterangan
from app.produksi_monitoring pm 
where pm.bbls_water_injection is not null

union all

select 
	pm.tanggal 
	, 3 as sandifield
	, pm.bbls_closing_stock jumlah
	, 'CLOSING STOCK' keterangan
from app.produksi_monitoring pm 
where pm.bbls_closing_stock is not null

union all

select 
	pm.tanggal 
	, 3 as sandifield
	, pm.bbls_actl jumlah
	, 'ACTL' keterangan
from app.produksi_monitoring pm 
where pm.bbls_actl is not null
) b
""",
    "safemanhours": """
SELECT COUNT(safe_man_hours_dmf) FROM app.produksi_monitoring
""",
    "produksi_target": """
;WITH src_unpivoted AS (
            SELECT reporting_year, reporting_month, target_dmf AS value,
                   'GAS' AS jenis, 'RKAP' AS jenis_target, created_at, updated_at
            FROM app.produksi_target

            UNION ALL

            SELECT reporting_year, reporting_month, target_gas_wpb AS value,
                   'GAS' AS jenis, 'WP&B' AS jenis_target, created_at, updated_at
            FROM app.produksi_target

            UNION ALL

            SELECT reporting_year, reporting_month, target_kondensat_rkap AS value,
                   'KONDENSAT' AS jenis, 'RKAP' AS jenis_target, created_at, updated_at
            FROM app.produksi_target

            UNION ALL

            SELECT reporting_year, reporting_month, target_kondensat_wpb AS value,
                   'KONDENSAT' AS jenis, 'WP&B' AS jenis_target, created_at, updated_at
            FROM app.produksi_target
        ),
        src_dedup AS (
            SELECT
                DATEFROMPARTS(reporting_year, reporting_month, 1) AS periodedata,
                value,
                jenis,
                jenis_target,
                created_at,
                updated_at,
                ROW_NUMBER() OVER (
                    PARTITION BY reporting_year, reporting_month, jenis, jenis_target
                    ORDER BY updated_at DESC
                ) AS rn
            FROM src_unpivoted
        )
        SELECT count(*)
        FROM src_dedup
        WHERE rn = 1;
""",
}

_DISABLED_JOBS = (
    "Field (dimensi)",
    "PSAIMS Monitoring",
    "LCV Karyawan",
    "LCV Pelatihan",
    "LCV Peserta Pelatihan",
)


def upgrade() -> None:
    conn = op.get_bind()
    for mart_table, sql in _EXPECTED.items():
        conn.execute(
            sa.text("UPDATE app.mart_sync_job SET expected_mart_count_sql = :sql WHERE mart_table = :t"),
            {"sql": sql, "t": mart_table},
        )
    for name in _DISABLED_JOBS:
        conn.execute(sa.text("UPDATE app.mart_sync_job SET is_active = 0 WHERE name = :name"), {"name": name})


def downgrade() -> None:
    # expected_mart_count_sql is not restored (martsync8 / prodwpb1 values are superseded); only re-enable the jobs.
    conn = op.get_bind()
    for name in _DISABLED_JOBS:
        conn.execute(sa.text("UPDATE app.mart_sync_job SET is_active = 1 WHERE name = :name"), {"name": name})
