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


class I2AIMSResponse(pydantic.BaseModel):
    id: typing.Any
    upload_batch_id: typing.Any
    owner_account_id: typing.Optional[typing.Any]
    reporting_year: int
    reporting_month: int
    field: typing.Optional[str]
    record_id: typing.Optional[str]
    inspection_date: typing.Optional[datetime.date]
    asset_id: typing.Optional[str]
    asset_name: typing.Optional[str]
    asset_type: typing.Optional[str]
    area: typing.Optional[str]
    sce_category: typing.Optional[str]
    integrity_status: typing.Optional[str]
    inspection_result: typing.Optional[str]
    inspection_compliance: typing.Optional[str]
    corrosion_rate: typing.Optional[str]
    remaining_life: typing.Optional[str]
    risk_rank: typing.Optional[str]
    anomaly_count: typing.Optional[str]
    process_safety_event: typing.Optional[str]
    barrier_health: typing.Optional[str]
    recommendation_status: typing.Optional[str]
    inspection_cost: typing.Optional[str]
    created_at: datetime.datetime
    updated_at: typing.Optional[datetime.datetime]

    class Config:
        orm_mode = True


class I2AIMSHistoryResponse(pydantic.BaseModel):
    upload_batch_id: typing.Any
    reporting_year: int
    reporting_month: int
    field: typing.Optional[str]
    upload_date: datetime.datetime
    record_count: int

    class Config:
        orm_mode = True
