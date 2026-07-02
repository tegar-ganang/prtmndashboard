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


class MOCResponse(pydantic.BaseModel):
    id: typing.Any
    upload_batch_id: typing.Any
    owner_account_id: typing.Optional[typing.Any]
    reporting_year: int
    reporting_month: int
    field: typing.Optional[str]
    moc_number: typing.Optional[str]
    change_desc: typing.Optional[str]
    issued_date: typing.Optional[datetime.date]
    done: typing.Optional[str]
    moc_owner: typing.Optional[str]
    last_updated: typing.Optional[datetime.date]
    ongoing_step: typing.Optional[str]
    pic: typing.Optional[str]
    status: typing.Optional[str]
    created_at: datetime.datetime
    updated_at: typing.Optional[datetime.datetime]

    class Config:
        orm_mode = True


class MOCHistoryResponse(pydantic.BaseModel):
    upload_batch_id: typing.Any
    reporting_year: int
    reporting_month: int
    field: typing.Optional[str]
    upload_date: datetime.datetime
    record_count: int

    class Config:
        orm_mode = True
