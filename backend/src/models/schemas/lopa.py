import typing
import datetime
import pydantic
from src.models.schemas.location import FieldLocationResponse

class DocumentMonthlyBatchCreate(pydantic.BaseModel):
    doc_type: str
    reporting_year: int
    reporting_month: int
    field: str | None = None
    mode: str = "append"
    items: list[dict[str, typing.Any]]

    class Config:
        allow_population_by_field_name = True
        orm_mode = True

class LopaResponse(pydantic.BaseModel):
    id: typing.Any
    upload_batch_id: typing.Any
    owner_account_id: typing.Any | None
    reporting_year: int
    reporting_month: int
    field: str | None
    field_location: FieldLocationResponse | None = None
    function_no: str | None
    function_name: str | None
    function_description: str | None
    final_element: str | None
    recommendation: str | None
    rrf_gap_value: str | None
    rrf_gap_type: str | None
    responsibility_pic: str | None
    target_date: datetime.date | None
    reminder_status: str | None
    response_progress: str | None
    status: str | None
    evidence: str | None
    completion_date: datetime.date | None
    created_at: datetime.datetime
    updated_at: datetime.datetime | None

    class Config:
        orm_mode = True

class LopaHistoryResponse(pydantic.BaseModel):
    upload_batch_id: typing.Any
    reporting_year: int
    reporting_month: int
    field: str | None
    upload_date: datetime.datetime
    record_count: int
    
    class Config:
        orm_mode = True
