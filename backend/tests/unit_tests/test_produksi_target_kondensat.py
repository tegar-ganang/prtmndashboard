import uuid
from io import BytesIO

import openpyxl
import pytest
from sqlalchemy.sql.dml import Delete

from src.models.db.produksi_target import ProduksiTarget
from src.repository.crud.produksi import ProduksiCRUDRepository


class _Result:
    def __init__(self, rows: list) -> None:
        self._rows = rows

    def scalars(self):
        return self

    def all(self):
        return self._rows


class _FakeAsyncSession:
    """Records added rows without touching a real DB. Every execute() returns `existing`
    (only the SELECT for already-stored targets reads it; UPDATE/DELETE results are unused)."""

    def __init__(self, existing: list | None = None) -> None:
        self.added: list = []
        self.executed: list = []
        self.existing = existing or []

    def add_all(self, objs):
        self.added.extend(objs)

    async def flush(self):
        pass

    async def commit(self):
        pass

    async def execute(self, stmt, *args, **kwargs):
        self.executed.append(stmt)
        return _Result(self.existing)


def _build_excel_bytes(header: list, values: list) -> bytes:
    wb = openpyxl.Workbook()

    sheet1 = wb.active
    sheet1.title = "Sheet1"
    sheet1.append(["Tanggal"] + [None] * 25 + ["SAFE MAN HOURS"])
    sheet1.append([None] * 26 + ["DONGGI MATINDOK FIELD"])
    sheet1.append(["2026-01-01"] + [None] * 25 + [123.0])  # col 26 = safe_man_hours_dmf

    sheet2 = wb.create_sheet("Sheet2")
    sheet2.append(["TARGET MMSCFD"] + [None] * (len(header) - 1))
    sheet2.append(header)
    sheet2.append(["2026-01-01", *values])

    buf = BytesIO()
    wb.save(buf)
    return buf.getvalue()


async def _upload(file_content: bytes, existing: list | None = None) -> _FakeAsyncSession:
    session = _FakeAsyncSession(existing)
    await ProduksiCRUDRepository(session).process_excel_and_save(
        file_content=file_content,
        owner_account_id="00000000-0000-0000-0000-000000000000",
        reporting_year=2026,
        reporting_month=1,
        field="DGI",
        mode="append",
    )
    return session


async def _parse_targets(file_content: bytes) -> list:
    session = await _upload(file_content)
    return [o for o in session.added if type(o).__name__ == "ProduksiTarget"]


def _stored_target(month: int, dmf: float, kondensat: float | None = None) -> ProduksiTarget:
    return ProduksiTarget(
        id=uuid.uuid4(), upload_batch_id=uuid.uuid4(), reporting_year=2026, reporting_month=month,
        target_dmf=dmf, target_kondensat=kondensat,
    )


@pytest.mark.asyncio
async def test_all_four_targets_are_parsed_by_header() -> None:
    """Sheet 2 has DMF, GAS WP&B, KONDENSAT RKAP, KONDENSAT WP&B — each must land
    on its own column, matched by header name rather than position.
    """
    targets = await _parse_targets(_build_excel_bytes(
        ["BULAN", "DMF", "GAS WP&B", "KONDENSAT RKAP", "KONDENSAT WP&B"],
        [94.4, 93.47, 738, 724],
    ))
    assert len(targets) == 1
    assert targets[0].target_dmf == 94.4
    assert targets[0].target_gas_wpb == 93.47
    assert targets[0].target_kondensat_rkap == 738
    assert targets[0].target_kondensat is None  # legacy column is not written by the new layout
    assert targets[0].target_kondensat_wpb == 724


@pytest.mark.asyncio
async def test_legacy_three_column_layout_still_works() -> None:
    targets = await _parse_targets(_build_excel_bytes(["BULAN", "DMF", "KONDENSAT"], [94.4, 12.5]))
    assert targets[0].target_dmf == 94.4
    assert targets[0].target_kondensat == 12.5
    assert targets[0].target_gas_wpb is None
    assert targets[0].target_kondensat_wpb is None


@pytest.mark.asyncio
async def test_missing_dmf_header_is_rejected() -> None:
    with pytest.raises(ValueError, match="DMF"):
        await _parse_targets(_build_excel_bytes(["BULAN", "GAS", "KONDENSAT"], [94.4, 12.5]))


@pytest.mark.asyncio
async def test_existing_month_is_updated_in_place_not_duplicated() -> None:
    """Upsert key = (reporting_year, reporting_month): re-uploading Jan must reuse the stored row
    (same id, so realisasi FKs stay valid), overwrite the columns in the sheet, and leave the rest."""
    stored = _stored_target(month=1, dmf=1.0, kondensat=999.0)
    stored_id = stored.id
    excel = _build_excel_bytes(["BULAN", "DMF", "GAS WP&B"], [94.4, 93.47])

    session = await _upload(excel, existing=[stored])

    assert [o for o in session.added if type(o).__name__ == "ProduksiTarget"] == []  # nothing inserted
    assert stored.id == stored_id
    assert stored.target_dmf == 94.4
    assert stored.target_gas_wpb == 93.47
    assert stored.target_kondensat == 999.0  # column absent from the sheet → untouched
    produksi = [o for o in session.added if type(o).__name__ == "Produksi"]
    assert [p.target_id for p in produksi] == [stored_id]


@pytest.mark.asyncio
async def test_old_duplicates_are_merged_into_the_newest_row() -> None:
    newest, older = _stored_target(1, dmf=1.0), _stored_target(1, dmf=2.0)  # query returns newest first
    excel = _build_excel_bytes(["BULAN", "DMF", "KONDENSAT"], [94.4, 12.5])

    session = await _upload(excel, existing=[newest, older])

    assert newest.target_dmf == 94.4 and newest.target_kondensat == 12.5
    assert sum(isinstance(st, Delete) for st in session.executed) == 1  # only the duplicate is removed
    produksi = [o for o in session.added if type(o).__name__ == "Produksi"]
    assert [p.target_id for p in produksi] == [newest.id]
