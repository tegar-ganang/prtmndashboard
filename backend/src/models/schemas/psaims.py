import typing
import datetime
import pydantic


# ── Zona Indicator ──────────────────────────────────────────────────────────────

class ZonaIndicatorBatchCreate(pydantic.BaseModel):
    doc_type: str = "ZONA_INDICATOR"
    reporting_year: int
    zona: str
    mode: str = "append"
    items: list[dict[str, typing.Any]]

    class Config:
        allow_population_by_field_name = True
        orm_mode = True


class ZonaIndicatorResponse(pydantic.BaseModel):
    id: typing.Any
    upload_batch_id: typing.Any
    owner_account_id: typing.Any | None
    reporting_year: int
    zona: str | None
    ind_type: str | None
    indicator: str | None
    unit: str | None
    description: str | None
    basis: str | None
    pic_name: str | None
    pic_email: str | None
    jan: float | None
    feb: float | None
    mar: float | None
    apr: float | None
    may: float | None
    jun: float | None
    jul: float | None
    aug: float | None
    sep: float | None
    oct: float | None
    nov: float | None
    dec: float | None
    ytd: float | None
    comment: str | None
    created_at: datetime.datetime
    updated_at: datetime.datetime | None

    class Config:
        orm_mode = True


class ZonaIndicatorHistoryResponse(pydantic.BaseModel):
    upload_batch_id: typing.Any
    reporting_year: int
    zona: str | None
    upload_date: datetime.datetime
    record_count: int

    class Config:
        orm_mode = True


# ── Zona PSE List ───────────────────────────────────────────────────────────────

class ZonaPseListBatchCreate(pydantic.BaseModel):
    doc_type: str = "ZONA_PSE_LIST"
    reporting_year: int
    reporting_month: int
    zona: str
    mode: str = "append"
    items: list[dict[str, typing.Any]]

    class Config:
        allow_population_by_field_name = True
        orm_mode = True


class ZonaPseListResponse(pydantic.BaseModel):
    id: typing.Any
    upload_batch_id: typing.Any
    owner_account_id: typing.Any | None
    reporting_year: int
    reporting_month: int
    zona: str | None
    no: str | None
    field_area: str | None
    lokasi: str | None
    unit_detail: str | None
    short_description: str | None
    event_issue_category: str | None
    activity: str | None
    type_location: str | None
    date_start: datetime.date | None
    time_start: str | None
    barrier_prevent: str | None
    barrier_mitigate: str | None
    lopc_released: str | None
    lopc_duration_hour: float | None
    lopc_flammable_gas_kg: float | None
    lopc_gas_one_hour_kg: float | None
    liquid_hc_type: str | None
    lopc_hc_liquid_barrel: float | None
    lopc_hc_liquid_one_hour_kg: float | None
    toxic_type: str | None
    lopc_toxic_kg: float | None
    lopc_toxic_one_hour_kg: float | None
    other_type: str | None
    lopc_other_kg: float | None
    lopc_other_one_hour_kg: float | None
    injured_worker: str | None
    affect_3rd_party: str | None
    number_injured_person: int | None
    number_fatality: int | None
    fire_explosion: str | None
    damage_fire_explosion_usd: float | None
    relief_device: str | None
    effect_relief_device: str | None
    pse_tier: str | None
    causal_1_desc: str | None
    causal_1_category: str | None
    causal_1_sub_category: str | None
    causal_2_desc: str | None
    causal_2_category: str | None
    causal_2_sub_category: str | None
    causal_3_desc: str | None
    causal_3_category: str | None
    causal_3_sub_category: str | None
    barrier_1_desc: str | None
    barrier_1_category: str | None
    barrier_1_sub_category: str | None
    barrier_2_desc: str | None
    barrier_2_category: str | None
    barrier_2_sub_category: str | None
    barrier_3_desc: str | None
    barrier_3_category: str | None
    barrier_3_sub_category: str | None
    remarks: str | None
    created_at: datetime.datetime
    updated_at: datetime.datetime | None

    class Config:
        orm_mode = True


class ZonaPseListHistoryResponse(pydantic.BaseModel):
    upload_batch_id: typing.Any
    reporting_year: int
    reporting_month: int
    zona: str | None
    upload_date: datetime.datetime
    record_count: int

    class Config:
        orm_mode = True
