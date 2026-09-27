"""One-command DB setup: alembic (stamp if needed + upgrade head) + mart_pertamina SQL scripts.

Run from `backend/`:  python -m scripts.setup_db
Safe to re-run: alembic skips applied revisions, SQL batches that hit "already exists" are skipped.
Stored procedures that already exist in the DB are left untouched (they may be hand-written);
pass --overwrite-procs to replace them with the versions in scripts/*.sql.
Views are never overwritten, and a view that fails to compile is reported and skipped (they are optional BI views).
"""
import pathlib
import re
import sys

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine
from sqlalchemy.exc import DBAPIError

# ponytail: assumes every table/column up to this revision already exists (created by create_all).
# Only used when the DB has tables but no alembic_version row; move forward if migrations older than this change.
BASELINE = "a1b2c3scurve1"

SQL_FILES = [
    "mart_pertamina_schema.sql",
    "mart_pertamina_sync_procedures.sql",
    "mart_pertamina_sync_procedures_batch2.sql",
    "mart_pertamina_sync_procedures_batch3.sql",
    "mart_pertamina_sync_procedures_batch4.sql",
]
ALREADY_EXISTS = re.compile(r"\((2714|1913)\)")  # object / index already exists
PROC_NAME = re.compile(r"^\s*CREATE\s+OR\s+ALTER\s+PROCEDURE\s+([\w.]+)", re.I | re.M)
VIEW_NAME = re.compile(r"^\s*CREATE\s+OR\s+ALTER\s+VIEW\s+([\w.]+)", re.I | re.M)


def sql_batches(path: pathlib.Path) -> list[str]:
    parts = re.split(r"^\s*GO\s*$", path.read_text(encoding="utf-8-sig"), flags=re.M | re.I)
    return [p for p in parts if p.strip()]


def needs_stamp(conn) -> bool:
    if not conn.exec_driver_sql("SELECT OBJECT_ID('app.account', 'U')").scalar():
        return False  # fresh DB: run the whole chain
    if not conn.exec_driver_sql("SELECT OBJECT_ID('app.alembic_version', 'U')").scalar():
        return True
    return conn.exec_driver_sql("SELECT COUNT(*) FROM app.alembic_version").scalar() == 0


def main() -> None:
    from src.repository.database import async_db

    engine = create_engine(async_db.set_async_db_uri.replace("+aioodbc", "+pyodbc"), isolation_level="AUTOCOMMIT")
    cfg = Config("alembic.ini")

    with engine.connect() as conn:
        conn.exec_driver_sql("IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'app') EXEC('CREATE SCHEMA app')")
        if needs_stamp(conn):
            print(f"[alembic] DB has tables but no version -> stamp {BASELINE}")
            command.stamp(cfg, BASELINE)
    command.upgrade(cfg, "head")

    scripts = pathlib.Path(__file__).parent
    overwrite = "--overwrite-procs" in sys.argv
    with engine.connect() as conn:
        for name in SQL_FILES:
            done = skipped = 0
            for batch in sql_batches(scripts / name):
                view = VIEW_NAME.search(batch)
                if view:
                    if conn.exec_driver_sql("SELECT OBJECT_ID(?, 'V')", (view.group(1),)).scalar():
                        skipped += 1
                    else:
                        try:
                            conn.exec_driver_sql(batch)
                            done += 1
                        except DBAPIError as e:
                            print(f"[sql] WARNING view {view.group(1)} not created: {str(e.orig)[:160]}")
                            skipped += 1
                    continue
                proc = PROC_NAME.search(batch)
                if proc and not overwrite and conn.exec_driver_sql("SELECT OBJECT_ID(?, 'P')", (proc.group(1),)).scalar():
                    skipped += 1
                    continue
                try:
                    conn.exec_driver_sql(batch)
                    done += 1
                except DBAPIError as e:
                    if not ALREADY_EXISTS.search(str(e.orig)):
                        raise
                    skipped += 1
            print(f"[sql] {name}: {done} applied, {skipped} skipped (already existed)")


if __name__ == "__main__":
    main()
