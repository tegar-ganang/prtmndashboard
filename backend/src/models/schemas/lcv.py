import typing
import datetime
import pydantic


class LCVProjectCharterBudayaResponse(pydantic.BaseModel):
    id: typing.Any
    upload_batch_id: typing.Any
    owner_account_id: typing.Optional[typing.Any]
    reporting_year: int
    reporting_month: int
    field: typing.Optional[str]
    id_project: typing.Optional[str]
    tanggal: typing.Optional[datetime.date]
    judul_project: typing.Optional[str]
    created_at: datetime.datetime
    updated_at: typing.Optional[datetime.datetime]

    class Config:
        orm_mode = True


class LCVMonitoringResponse(pydantic.BaseModel):
    id: typing.Any
    upload_batch_id: typing.Any
    owner_account_id: typing.Optional[typing.Any]
    reporting_year: int
    reporting_month: int
    field: typing.Optional[str]
    namapegawai: typing.Optional[str]
    nip: typing.Optional[str]
    departemen: typing.Optional[str]
    lcv_conflictofinterest: typing.Optional[str]
    lcv_codeofconduct: typing.Optional[str]
    lcv_laporgratifikasi: typing.Optional[str]
    lcv_sosialisasi_lcv: typing.Optional[str]
    lcv_lhkpn: typing.Optional[str]
    training_isec: typing.Optional[str]
    training_lcv: typing.Optional[str]
    trainining_virtualdemoroomhsse: typing.Optional[str]
    training_stressmanagement: typing.Optional[str]
    training_fraudawareness: typing.Optional[str]
    projectchapterbudaya: typing.Optional[str]
    tahun: typing.Optional[str]
    created_at: datetime.datetime
    updated_at: typing.Optional[datetime.datetime]

    class Config:
        orm_mode = True


class LCVHistoryResponse(pydantic.BaseModel):
    upload_batch_id: typing.Any
    reporting_year: int
    reporting_month: int
    field: typing.Optional[str]
    upload_date: datetime.datetime
    record_count: int

    class Config:
        orm_mode = True
