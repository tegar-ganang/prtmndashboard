import typing
import datetime
import pydantic
from src.models.schemas.location import FieldLocationResponse

class DocumentMonthlyBatchCreate(pydantic.BaseModel):
    doc_type: str
    reporting_year: int
    reporting_month: int
    field: typing.Optional[str] = None
    mode: str = "append"
    items: list[dict[str, typing.Any]]

    class Config:
        allow_population_by_field_name = True
        orm_mode = True

class HazopResponse(pydantic.BaseModel):
    id: typing.Any
    upload_batch_id: typing.Any
    owner_account_id: typing.Optional[typing.Any]
    reporting_year: int
    reporting_month: int
    field: typing.Optional[str]
    field_location: typing.Optional[FieldLocationResponse] = None
    node_no: typing.Optional[str]
    rec_no: typing.Optional[str]
    node: typing.Optional[str]
    deviation: typing.Optional[str]
    possible_cause: typing.Optional[str]
    consequences: typing.Optional[str]
    safeguard: typing.Optional[str]
    recommendation: typing.Optional[str]
    likelihood: typing.Optional[str]
    severity: typing.Optional[str]
    risk: typing.Optional[str]
    responsibility_pic: typing.Optional[str]
    type: typing.Optional[str]
    target_date: typing.Optional[datetime.date]
    response_progress: typing.Optional[str]
    category: typing.Optional[str]
    sub_category: typing.Optional[str]
    status: typing.Optional[str]
    evidence: typing.Optional[str]
    completion_date: typing.Optional[datetime.date]
    sme: typing.Optional[str]
    created_at: datetime.datetime
    updated_at: typing.Optional[datetime.datetime]

    class Config:
        orm_mode = True

class HazopHistoryResponse(pydantic.BaseModel):
    upload_batch_id: typing.Any
    reporting_year: int
    reporting_month: int
    field: typing.Optional[str]
    upload_date: datetime.datetime
    record_count: int
    
    class Config:
        orm_mode = True
