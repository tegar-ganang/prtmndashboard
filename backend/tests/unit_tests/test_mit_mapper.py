import types

import pytest

from src.repository.crud.mit import MITCRUDRepository


class _FakeAsyncSession:
    """Records the insert statement's values without touching a real DB."""

    def __init__(self) -> None:
        self.inserted_values: list[dict] = None

    async def execute(self, stmt, values=None):
        self.inserted_values = values

    async def commit(self):
        pass


@pytest.mark.asyncio
async def test_reg_lokasi_is_mapped_and_saved_from_upload() -> None:
    """Regression test: 'No Registration - Lokasi' must reach reg_lokasi.

    Previously MIT_MAPPER had no entry for this Excel header, so uploaded
    rows always ended up with reg_lokasi = NULL in the database even when
    the source file had a value.
    """
    session = _FakeAsyncSession()
    repo = MITCRUDRepository(session)

    batch_data = types.SimpleNamespace(
        reporting_year=2026,
        reporting_quarter=3,
        field="DGI",
        mode="append",
        items=[{"No Registration - Lokasi": "DNG", "No Registration - Jenis MIT": "MIT"}],
    )

    await repo.create_batch(batch_data=batch_data, owner_account_id="00000000-0000-0000-0000-000000000000")

    assert session.inserted_values is not None
    row = session.inserted_values[0]
    assert row["reg_lokasi"] == "DNG"
    assert row["reg_jenis_mit"] == "MIT"
