import typing
import datetime
from src.models.schemas.base import BaseSchemaModel

import pydantic

class DocumentBatchCreate(pydantic.BaseModel):
    doc_type: str
    reporting_year: int
    reporting_quarter: int
    field: str | None = None
    mode: str = "append"
    items: list[dict[str, typing.Any]]

    class Config:
        allow_population_by_field_name = True
        orm_mode = True

# Keeping MITResponse for when querying data (if needed)
class MITResponse(pydantic.BaseModel):
    id: typing.Any
    upload_batch_id: typing.Any
    owner_account_id: typing.Any | None
    area: str | None
    field: str | None
    reg_lokasi: str | None
    reg_jenis_mit: str | None
    reg_kategori: str | None
    reg_tahun: str | None
    reg_no: str | None
    mit_declaration_date: datetime.date | None
    mit_title_asset: str | None
    integrity_threats: str | None
    possible_scenario: str | None
    consequences: str | None
    available_safeguard: str | None
    current_likelihood: str | None
    current_severity: str | None
    current_risk_rating: str | None
    rec_no: str | None
    recommendation_action: str | None
    pic: str | None
    target_closing: datetime.date | None
    remarks: str | None
    target_likelihood: str | None
    target_severity: str | None
    target_risk_rating: str | None
    mit_status: str | None
    evidence_path: str | None
    closing_date: datetime.date | None
    created_at: datetime.datetime
    updated_at: datetime.datetime | None

    class Config:
        orm_mode = True

class MitHistoryResponse(pydantic.BaseModel):
    upload_batch_id: typing.Any
    reporting_year: int
    reporting_quarter: int
    field: str | None
    upload_date: datetime.datetime
    record_count: int
    
    class Config:
        orm_mode = True
