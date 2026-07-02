import typing
import datetime
import pydantic


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


class AIRMSResponse(pydantic.BaseModel):
    id: typing.Any
    upload_batch_id: typing.Any
    owner_account_id: typing.Optional[typing.Any]
    reporting_year: int
    reporting_month: int
    field: typing.Optional[str]
    record_id: typing.Optional[str]
    date: typing.Optional[datetime.date]
    asset_id: typing.Optional[str]
    asset_name: typing.Optional[str]
    area: typing.Optional[str]
    availability: typing.Optional[str]
    reliability: typing.Optional[str]
    mtbf: typing.Optional[str]
    mttr: typing.Optional[str]
    wo_type: typing.Optional[str]
    wo_status: typing.Optional[str]
    maintenance_cost: typing.Optional[str]
    downtime_type: typing.Optional[str]
    downtime_hours: typing.Optional[str]
    lost_boe: typing.Optional[str]
    health_index: typing.Optional[str]
    created_at: datetime.datetime
    updated_at: typing.Optional[datetime.datetime]

    class Config:
        orm_mode = True


class AIRMSHistoryResponse(pydantic.BaseModel):
    upload_batch_id: typing.Any
    reporting_year: int
    reporting_month: int
    field: typing.Optional[str]
    upload_date: datetime.datetime
    record_count: int

    class Config:
        orm_mode = True
