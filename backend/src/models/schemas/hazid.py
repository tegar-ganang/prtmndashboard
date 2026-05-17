import typing
import datetime
import pydantic

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

class HazidResponse(pydantic.BaseModel):
    id: typing.Any
    upload_batch_id: typing.Any
    owner_account_id: typing.Any | None
    reporting_year: int
    reporting_month: int
    field: str | None
    node_no: str | None
    rec_no: str | None
    node: str | None
    guideword: str | None
    hazard: str | None
    consequences: str | None
    safeguard: str | None
    recommendation: str | None
    likelihood: str | None
    severity: str | None
    risk: str | None
    responsibility_pic: str | None
    type: str | None
    target_date: datetime.date | None
    response_progress: str | None
    category: str | None
    sub_category: str | None
    status: str | None
    evidence: str | None
    completion_date: datetime.date | None
    created_at: datetime.datetime
    updated_at: datetime.datetime | None

    class Config:
        orm_mode = True

class HazidHistoryResponse(pydantic.BaseModel):
    upload_batch_id: typing.Any
    reporting_year: int
    reporting_month: int
    field: str | None
    upload_date: datetime.datetime
    record_count: int
    
    class Config:
        orm_mode = True
