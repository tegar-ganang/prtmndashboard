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


@pytest.mark.asyncio
async def test_reg_lokasi_falls_back_to_dropdown_field_and_target_closing_kept_as_text() -> None:
    """Lokasi isn't in the sheet anymore — it comes from the field dropdown.
    Target Closing is free text and must not be dropped by date parsing."""
    session = _FakeAsyncSession()
    repo = MITCRUDRepository(session)

    batch_data = types.SimpleNamespace(
        reporting_year=2026,
        reporting_quarter=3,
        field="DGI",
        mode="append",
        items=[
            {"No Registration - Jenis MIT": "MIT", "Target Closing": "TAR 2027", "MIT Declaration Date": "2025-03-21"},
            {"Target Closing": 2026},
        ],
    )

    await repo.create_batch(batch_data=batch_data, owner_account_id="00000000-0000-0000-0000-000000000000")

    first, second = session.inserted_values
    assert first["reg_lokasi"] == "DGI"
    assert first["target_closing"] == "TAR 2027"
    assert str(first["mit_declaration_date"]) == "2025-03-21"
    assert second["target_closing"] == "2026"


def test_mit_response_accepts_target_closing_before_and_after_migration() -> None:
    import datetime

    from src.models.schemas.mit import MITResponse

    base = dict(id=1, upload_batch_id=1, created_at=datetime.datetime(2026, 1, 1))
    assert MITResponse.parse_obj({**base, "target_closing": datetime.date(2025, 1, 1)}).target_closing == datetime.date(2025, 1, 1)
    assert MITResponse.parse_obj({**base, "target_closing": "TAR 2027"}).target_closing == "TAR 2027"
