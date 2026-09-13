from io import BytesIO

import openpyxl
import pytest

from src.repository.crud.produksi import ProduksiCRUDRepository


class _FakeAsyncSession:
    """Records added rows without touching a real DB."""

    def __init__(self) -> None:
        self.added: list = []

    def add_all(self, objs):
        self.added.extend(objs)

    async def flush(self):
        pass

    async def commit(self):
        pass

    async def execute(self, *args, **kwargs):
        pass


def _build_excel_bytes() -> bytes:
    wb = openpyxl.Workbook()

    sheet1 = wb.active
    sheet1.title = "Sheet1"
    sheet1.append(["Tanggal"] + [None] * 26)
    sheet1.append([None] * 27)
    sheet1.append(["2026-01-01"] + [None] * 25 + [123.0])  # col 26 = safe_man_hours_actl

    sheet2 = wb.create_sheet("Sheet2")
    sheet2.append(["TARGET MMSCFD", None, None])
    sheet2.append(["BULAN", "DMF", "KONDENSAT"])
    sheet2.append(["2026-01-01", 94.4, 12.5])

    buf = BytesIO()
    wb.save(buf)
    return buf.getvalue()


@pytest.mark.asyncio
async def test_target_kondensat_is_parsed_from_sheet2() -> None:
    """Regression test: Sheet 2's 3rd column (KONDENSAT) must be captured
    onto ProduksiTarget.target_kondensat, alongside the existing GAS value
    (target_dmf), instead of being ignored.
    """
    session = _FakeAsyncSession()
    repo = ProduksiCRUDRepository(session)

    await repo.process_excel_and_save(
        file_content=_build_excel_bytes(),
        owner_account_id="00000000-0000-0000-0000-000000000000",
        reporting_year=2026,
        reporting_month=1,
        field="DGI",
        mode="append",
    )

    targets = [o for o in session.added if type(o).__name__ == "ProduksiTarget"]
    assert len(targets) == 1
    assert targets[0].target_dmf == 94.4
    assert targets[0].target_kondensat == 12.5
