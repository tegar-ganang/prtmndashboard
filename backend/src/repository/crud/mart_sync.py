import re
import typing

import sqlalchemy
from sqlalchemy.ext.asyncio import AsyncSession as SQLAlchemyAsyncSession

from src.models.db.mart_sync_job import MartSyncJob
from src.repository.crud.base import BaseCRUDRepository
from src.repository.database import async_db

# Table/schema identifiers are interpolated into raw SQL below (MSSQL doesn't
# allow parameter binding for object names), so validate them against a safe
# charset first instead of trusting whatever is stored in mart_sync_job.
_SAFE_IDENTIFIER = re.compile(r"^[A-Za-z0-9_]+$")


class MartSyncCRUDRepository(BaseCRUDRepository):

    async def get_jobs(self) -> typing.Sequence[MartSyncJob]:
        stmt = (
            sqlalchemy.select(MartSyncJob)
            .where(MartSyncJob.is_active == True)  # noqa: E712 — MSSQL BIT needs `=`, `.is_()` compiles to invalid `IS 1`
            .order_by(MartSyncJob.sort_order.asc())
        )
        res = await self.async_session.execute(stmt)
        return res.scalars().all()

    async def _count_rows(self, schema: str, table: str) -> tuple[int | None, str | None]:
        if not _SAFE_IDENTIFIER.match(table):
            return None, "Nama tabel tidak valid"
        # Each check gets its own session instead of reusing self.async_session —
        # running many sequential fallible queries (several tables don't exist
        # yet) on one shared session left it in a broken pool-checkout state
        # after the first failure (aioodbc + pool_pre_ping MissingGreenlet).
        try:
            async with SQLAlchemyAsyncSession(async_db.async_engine) as session:
                res = await session.execute(sqlalchemy.text(f"SELECT COUNT(*) FROM {schema}.{table}"))
                return res.scalar_one(), None
        except Exception:
            return None, "Tabel tidak ditemukan"

    async def _expected_count(self, sql: str | None) -> int | None:
        if not sql:
            return None
        try:
            async with SQLAlchemyAsyncSession(async_db.async_engine) as session:
                return (await session.execute(sqlalchemy.text(sql))).scalar_one()
        except Exception:
            return None

    async def get_table_counts(self) -> list[dict[str, typing.Any]]:
        jobs = await self.get_jobs()
        rows: list[dict[str, typing.Any]] = []
        for job in jobs:
            app_count, app_error = await self._count_rows("app", job.app_table)
            mart_count, mart_error = await self._count_rows("mart_pertamina", job.mart_table)
            expected = await self._expected_count(job.expected_mart_count_sql)
            rows.append({
                "id": job.id,
                "name": job.name,
                "app_table": job.app_table,
                "app_count": app_count,
                "app_error": app_error,
                "expected_mart_count": expected,
                "mart_table": job.mart_table,
                "mart_count": mart_count,
                "mart_error": mart_error,
            })
        return rows

    async def run_sync(self) -> list[dict[str, typing.Any]]:
        """Execute every active job's sync_script in order, one at a time.

        Each job runs independently — one failing (e.g. a stored proc that
        doesn't exist yet) must not block the rest from running.
        """
        jobs = await self.get_jobs()
        results: list[dict[str, typing.Any]] = []
        for job in jobs:
            # Own session per script, same reasoning as _count_rows above.
            try:
                async with SQLAlchemyAsyncSession(async_db.async_engine) as session:
                    await session.execute(sqlalchemy.text(job.sync_script))
                    await session.commit()
                results.append({
                    "name": job.name, "sync_script": job.sync_script, "success": True, "error": None,
                })
            except Exception as exc:
                results.append({
                    "name": job.name, "sync_script": job.sync_script, "success": False, "error": str(exc),
                })
        return results
