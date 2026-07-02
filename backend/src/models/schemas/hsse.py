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


class HSSEResponse(pydantic.BaseModel):
    id: typing.Any
    upload_batch_id: typing.Any
    owner_account_id: typing.Optional[typing.Any]
    reporting_year: int
    reporting_month: int
    field: typing.Optional[str]
    id_izin: typing.Optional[str]
    tanggal: typing.Optional[datetime.date]
    bulan_tahun: typing.Optional[str]
    lokasi: typing.Optional[str]
    jenis_izin_kerja: typing.Optional[str]
    job_complete: typing.Optional[str]
    jumlah_icc: typing.Optional[str]
    status_dispensasi: typing.Optional[str]
    jenis_deviasi: typing.Optional[str]
    status_deviasi: typing.Optional[str]
    tingkat_resiko: typing.Optional[str]
    created_at: datetime.datetime
    updated_at: typing.Optional[datetime.datetime]

    class Config:
        orm_mode = True


class HSSEHistoryResponse(pydantic.BaseModel):
    upload_batch_id: typing.Any
    reporting_year: int
    reporting_month: int
    field: typing.Optional[str]
    upload_date: datetime.datetime
    record_count: int

    class Config:
        orm_mode = True
