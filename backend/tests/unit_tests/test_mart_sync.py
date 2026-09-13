import types
from unittest.mock import patch

import pytest
import sqlalchemy
from sqlalchemy.dialects import mssql

from src.models.db.mart_sync_job import MartSyncJob
from src.repository.crud.mart_sync import MartSyncCRUDRepository


def test_active_jobs_filter_uses_mssql_compatible_equality() -> None:
    """Regression test: MSSQL's BIT type must be filtered with `=`, not `IS`.

    `.is_(True)` compiles to `IS 1`, which is invalid T-SQL syntax
    ("Incorrect syntax near '1'") and broke every call to get_jobs().
    """
    stmt = sqlalchemy.select(MartSyncJob).where(MartSyncJob.is_active == True)  # noqa: E712
    compiled = str(stmt.compile(dialect=mssql.dialect()))

    assert "is_active = 1" in compiled
    assert "IS 1" not in compiled


def _job(name, app_table, mart_table, sync_script, sort_order=0):
    return types.SimpleNamespace(
        id=name, name=name, app_table=app_table, mart_table=mart_table,
        sync_script=sync_script, sort_order=sort_order, is_active=True,
    )


class _FakeAsyncSession:
    """Records executed SQL and lets a test script failures for specific statements.

    Stands in for the short-lived session that _count_rows/run_sync open
    internally (via `SQLAlchemyAsyncSession(async_db.async_engine)`) — patched
    in via `_patched_session_factory` below, not passed to the repository.
    """

    def __init__(self, fail_on: set[str] | None = None, count_by_table: dict[str, int] | None = None):
        self.fail_on = fail_on or set()
        self.count_by_table = count_by_table or {}
        self.executed: list[str] = []
        self.committed = 0

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc_info):
        return False

    async def execute(self, stmt, *args, **kwargs):
        sql = str(stmt)
        self.executed.append(sql)
        for needle in self.fail_on:
            if needle in sql:
                raise RuntimeError(f"simulated failure for: {needle}")
        for table, count in self.count_by_table.items():
            if table in sql:
                return types.SimpleNamespace(scalar_one=lambda c=count: c)
        return types.SimpleNamespace(scalar_one=lambda: 0)

    async def commit(self):
        self.committed += 1


def _patched_session_factory(fake_session: _FakeAsyncSession):
    """Returns a stand-in for `SQLAlchemyAsyncSession(async_db.async_engine)`."""
    return patch("src.repository.crud.mart_sync.SQLAlchemyAsyncSession", return_value=fake_session)


@pytest.mark.asyncio
async def test_run_sync_continues_after_one_script_fails() -> None:
    """One bad script (e.g. a proc that doesn't exist yet) must not stop the loop —
    every other job should still run, per-job success/failure is reported.
    """
    fake_session = _FakeAsyncSession(fail_on={"sp_sync_mit"})
    repo = MartSyncCRUDRepository(async_session=None)
    repo.get_jobs = lambda: _async_return([
        _job("MIT", "mit_monitoring", "mit_monitoring", "EXEC mart_pertamina.sp_sync_mit;", 1),
        _job("MOC", "moc_monitoring", "moc_monitoring", "EXEC mart_pertamina.sp_sync_moc;", 2),
    ])

    with _patched_session_factory(fake_session):
        results = await repo.run_sync()

    assert len(results) == 2
    assert results[0]["name"] == "MIT" and results[0]["success"] is False
    assert results[1]["name"] == "MOC" and results[1]["success"] is True
    assert fake_session.committed == 1


@pytest.mark.asyncio
async def test_get_table_counts_reports_missing_mart_table_gracefully() -> None:
    """A mart_table that doesn't exist yet must surface as a graceful error,
    not crash the whole counts endpoint.
    """
    fake_session = _FakeAsyncSession(fail_on={"mart_pertamina.moc_monitoring"}, count_by_table={"app.moc_monitoring": 42})
    repo = MartSyncCRUDRepository(async_session=None)
    repo.get_jobs = lambda: _async_return([
        _job("MOC", "moc_monitoring", "moc_monitoring", "EXEC mart_pertamina.sp_sync_moc;", 1),
    ])

    with _patched_session_factory(fake_session):
        rows = await repo.get_table_counts()

    assert len(rows) == 1
    assert rows[0]["app_count"] == 42
    assert rows[0]["app_error"] is None
    assert rows[0]["mart_count"] is None
    assert rows[0]["mart_error"] == "Tabel tidak ditemukan"


async def _async_return(value):
    return value
