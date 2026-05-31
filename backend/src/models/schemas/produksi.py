import typing
import datetime
import pydantic
from src.models.schemas.location import FieldLocationResponse


class ProduksiTargetResponse(pydantic.BaseModel):
    """Schema untuk tabel produksi_target (target bulanan dari Sheet 2 Excel)."""
    id: typing.Any
    upload_batch_id: typing.Any
    owner_account_id: typing.Optional[typing.Any]
    reporting_year: int
    reporting_month: int
    field: typing.Optional[str]
    field_location: typing.Optional[FieldLocationResponse] = None
    target_dmf: typing.Optional[float]
    created_at: datetime.datetime
    updated_at: typing.Optional[datetime.datetime]

    class Config:
        orm_mode = True


class ProduksiResponse(pydantic.BaseModel):
    """Schema untuk tabel produksi_monitoring (realisasi harian dari Sheet 1 Excel)."""
    id: typing.Any
    upload_batch_id: typing.Any
    owner_account_id: typing.Optional[typing.Any]
    target_id: typing.Optional[typing.Any]  # FK ke produksi_target

    reporting_year: int
    reporting_month: int
    field: typing.Optional[str]
    field_location: typing.Optional[FieldLocationResponse] = None

    # Target bulanan yang direlasikan (nested)
    target: typing.Optional[ProduksiTargetResponse] = None

    # Daily data fields
    tanggal: datetime.date

    # PUPO / SOT (BOPD)
    pupo_sot_target:   typing.Optional[float]
    pupo_sot_real:     typing.Optional[float]
    pupo_sot_donggi:   typing.Optional[float]
    pupo_sot_matindok: typing.Optional[float]

    # Operasi (BOPD)
    op_target:         typing.Optional[float]
    op_real:           typing.Optional[float]
    op_donggi:         typing.Optional[float]
    op_matindok:       typing.Optional[float]

    # Gas MMSCFD — Donggi Field
    donggi_prod:        typing.Optional[float]
    donggi_own_use:     typing.Optional[float]
    donggi_sales:       typing.Optional[float]
    donggi_main_flare:  typing.Optional[float]
    donggi_acid_flare:  typing.Optional[float]
    donggi_venting_co2: typing.Optional[float]
    donggi_losses:      typing.Optional[float]

    # Gas MMSCFD — Matindok Field
    matindok_prod:        typing.Optional[float]
    matindok_own_use:     typing.Optional[float]
    matindok_sales:       typing.Optional[float]
    matindok_main_flare:  typing.Optional[float]
    matindok_acid_flare:  typing.Optional[float]
    matindok_venting_co2: typing.Optional[float]
    matindok_losses:      typing.Optional[float]

    # BBLS — Donggi Matindok Field
    bbls_processed_water: typing.Optional[float]
    bbls_water_injection: typing.Optional[float]
    bbls_closing_stock:   typing.Optional[float]

    # Safe Man Hours
    safe_man_hours_actl: typing.Optional[float]
    safe_man_hours_dmf:  typing.Optional[float]

    created_at: datetime.datetime
    updated_at: typing.Optional[datetime.datetime]

    class Config:
        orm_mode = True


class ProduksiHistoryResponse(pydantic.BaseModel):
    upload_batch_id: typing.Any
    reporting_year: int
    reporting_month: int
    field: typing.Optional[str]
    upload_date: datetime.datetime
    record_count: int

    class Config:
        orm_mode = True
