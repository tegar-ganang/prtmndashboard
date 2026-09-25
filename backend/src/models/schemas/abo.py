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


class ABOResponse(pydantic.BaseModel):
    id: typing.Any
    upload_batch_id: typing.Any
    owner_account_id: typing.Optional[typing.Any]
    reporting_year: int
    reporting_month: int
    field: typing.Optional[str]
    no_rk: typing.Optional[str]
    jenis_kerangka_anggaran: typing.Optional[str]
    anggaranwpb_osf_nilai_usd: typing.Optional[str]
    anggaranwpb_osf_nilai_idr: typing.Optional[str]
    anggaranwpb_osf_percent: typing.Optional[str]
    commitment_spk_ppn_nilai_idr: typing.Optional[str]
    commitment_spk_ppn_percent: typing.Optional[str]
    sa_approved_ppn_nilai_usd: typing.Optional[str]
    sa_approved_ppn_percent_usd: typing.Optional[str]
    sa_approved_ppn_nilai_idr: typing.Optional[str]
    sa_approved_ppn_percent_idr: typing.Optional[str]
    actual_invoice_nilai_usd: typing.Optional[str]
    actual_invoice_percent_usd: typing.Optional[str]
    actual_invoice_nilai_idr: typing.Optional[str]
    actual_invoice_percent_idr: typing.Optional[str]
    sisa_anggaran_nilai_usd: typing.Optional[str]
    sisa_anggaran_percent_usd: typing.Optional[str]
    sisa_anggaran_nilai_idr: typing.Optional[str]
    sisa_anggaran_percent_idr: typing.Optional[str]
    flag: typing.Optional[str]
    created_at: datetime.datetime
    updated_at: typing.Optional[datetime.datetime]

    class Config:
        orm_mode = True


class ABOHistoryResponse(pydantic.BaseModel):
    upload_batch_id: typing.Any
    reporting_year: int
    reporting_month: int
    field: typing.Optional[str]
    upload_date: datetime.datetime
    record_count: int

    class Config:
        orm_mode = True
