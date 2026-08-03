import typing
import uuid
from datetime import datetime, date, time

import sqlalchemy
from sqlalchemy.sql import functions as sqlalchemy_functions

from src.models.db.zona_pse_list import ZonaPseList
from src.repository.crud.base_monitoring import BaseMonitoringRepository, parse_date


ZONA_PSE_LIST_MAPPER = {
    "NO": "no",
    "FIELD / AREA": "field_area",
    "LOKASI": "lokasi",
    "UNIT / DETAIL ": "unit_detail",
    "SHORT DESCRIPTION": "short_description",
    "EVENT ISSUE CATEGORY": "event_issue_category",
    "ACTIVITY": "activity",
    "TYPE LOCATION": "type_location",
    "DATE START (DD/MM/YYYY)": "date_start",
    "TIME START @LOCAL\n (HH:MM)": "time_start",
    "BARRIER PREVENT?": "barrier_prevent",
    "BARRIER MITIGATE?": "barrier_mitigate",
    "LOPC RELEASED?": "lopc_released",
    "LOPC DURATION (hour)": "lopc_duration_hour",
    "LOPC FLAMMABLE GAS (kg)": "lopc_flammable_gas_kg",
    " LOPC GAS \nIN ANY ONE HOUR PERIODE (kg) ": "lopc_gas_one_hour_kg",
    "LIQUID HC\n(TYPE MATERIAL)": "liquid_hc_type",
    "LOPC HC LIQUID (barrel)": "lopc_hc_liquid_barrel",
    " LOPC HC LIQUID \nIN ANY ONE HOUR PERIODE (kg) ": "lopc_hc_liquid_one_hour_kg",
    "TOXIC \n(TYPE MATERIAL)": "toxic_type",
    "LOPC TOXIC (kg)": "lopc_toxic_kg",
    " LOPC TOXIC \nIN ANY ONE HOUR PERIODE (kg) ": "lopc_toxic_one_hour_kg",
    "OTHER \n(TYPE MATERIAL)": "other_type",
    "LOPC OTHER (kg)": "lopc_other_kg",
    " LOPC OTHER \nIN ANY ONE HOUR PERIODE (kg) ": "lopc_other_one_hour_kg",
    "INJURED WORKER?": "injured_worker",
    "AFFECT 3rd PARTY?": "affect_3rd_party",
    "NUMBER INJURED PERSON?": "number_injured_person",
    "NUMBER FATALITY?": "number_fatality",
    "FIRE / EXPLOSION?": "fire_explosion",
    " DAMAGE BY FIRE / EXPLOSION (US$) ": "damage_fire_explosion_usd",
    "RELIEF DEVICE / UPSET EMISSION?": "relief_device",
    "EFFECT TO DISCHARGE POINT OF RELIEF DEVICE / UPSET EMISSION? ": "effect_relief_device",
    "PSE TIER": "pse_tier",
    # Causal factors — index based since headers repeat
    "CAUSAL_1_DESC": "causal_1_desc",
    "CAUSAL_1_CATEGORY": "causal_1_category",
    "CAUSAL_1_SUB_CATEGORY": "causal_1_sub_category",
    "CAUSAL_2_DESC": "causal_2_desc",
    "CAUSAL_2_CATEGORY": "causal_2_category",
    "CAUSAL_2_SUB_CATEGORY": "causal_2_sub_category",
    "CAUSAL_3_DESC": "causal_3_desc",
    "CAUSAL_3_CATEGORY": "causal_3_category",
    "CAUSAL_3_SUB_CATEGORY": "causal_3_sub_category",
    # Barrier failures — index based
    "BARRIER_1_DESC": "barrier_1_desc",
    "BARRIER_1_CATEGORY": "barrier_1_category",
    "BARRIER_1_SUB_CATEGORY": "barrier_1_sub_category",
    "BARRIER_2_DESC": "barrier_2_desc",
    "BARRIER_2_CATEGORY": "barrier_2_category",
    "BARRIER_2_SUB_CATEGORY": "barrier_2_sub_category",
    "BARRIER_3_DESC": "barrier_3_desc",
    "BARRIER_3_CATEGORY": "barrier_3_category",
    "BARRIER_3_SUB_CATEGORY": "barrier_3_sub_category",
    "REMARKS": "remarks",
}

FLOAT_COLUMNS = {
    "lopc_duration_hour", "lopc_flammable_gas_kg", "lopc_gas_one_hour_kg",
    "lopc_hc_liquid_barrel", "lopc_hc_liquid_one_hour_kg",
    "lopc_toxic_kg", "lopc_toxic_one_hour_kg",
    "lopc_other_kg", "lopc_other_one_hour_kg",
    "damage_fire_explosion_usd",
}

INT_COLUMNS = {"number_injured_person", "number_fatality"}

DATE_COLUMNS = {"date_start"}


def _parse_float(value: typing.Any) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def _parse_int(value: typing.Any) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return None


def _parse_time(value: typing.Any) -> str | None:
    """Convert time object or string to HH:MM string."""
    if value is None:
        return None
    if isinstance(value, time):
        return value.strftime("%H:%M")
    return str(value).strip()[:20] if str(value).strip() else None


class ZonaPseListCRUDRepository(BaseMonitoringRepository):
    model = ZonaPseList
    mapper = ZONA_PSE_LIST_MAPPER
    period_col = "reporting_month"
    date_columns = ["date_start"]

    async def check_period_exists(self, year: int, period: int, field: str | None = None) -> bool:
        zona = field  # reuse 'field' as 'zona' for compatibility
        conditions = [
            self.model.reporting_year == year,
            self.model.reporting_month == period,
        ]
        if zona is not None:
            conditions.append(self.model.zona == zona)
        stmt = sqlalchemy.select(self.model.id).where(*conditions).limit(1)
        res = await self.async_session.execute(stmt)
        return res.first() is not None

    async def create_batch(self, batch_data: typing.Any, owner_account_id: str) -> str:
        upload_batch_id = str(uuid.uuid4())
        zona_value: str | None = getattr(batch_data, "zona", None)

        if batch_data.mode == "overwrite":
            conditions = [
                self.model.reporting_year == batch_data.reporting_year,
                self.model.reporting_month == batch_data.reporting_month,
            ]
            if zona_value is not None:
                conditions.append(self.model.zona == zona_value)
            delete_stmt = sqlalchemy.delete(self.model).where(*conditions)
            await self.async_session.execute(delete_stmt)
            await self.async_session.flush()

        dicts_to_insert = []
        for item in batch_data.items:
            kwargs: dict[str, typing.Any] = {
                "id": uuid.uuid4(),
                "reporting_year": batch_data.reporting_year,
                "reporting_month": batch_data.reporting_month,
                "zona": zona_value,
                "upload_batch_id": upload_batch_id,
                "owner_account_id": owner_account_id,
            }

            for excel_key, db_column in self.mapper.items():
                value = item.get(excel_key)
                if db_column in DATE_COLUMNS:
                    kwargs[db_column] = parse_date(value)
                elif db_column == "time_start":
                    kwargs[db_column] = _parse_time(value)
                elif db_column in FLOAT_COLUMNS:
                    kwargs[db_column] = _parse_float(value)
                elif db_column in INT_COLUMNS:
                    kwargs[db_column] = _parse_int(value)
                elif value is not None:
                    val_str = str(value)
                    col_attr = getattr(self.model, db_column, None)
                    if col_attr is not None and hasattr(col_attr, "type") and hasattr(col_attr.type, "length") and col_attr.type.length is not None:
                        val_str = val_str[:col_attr.type.length]
                    kwargs[db_column] = val_str
                else:
                    kwargs[db_column] = None

            dicts_to_insert.append(kwargs)

        if dicts_to_insert:
            stmt = sqlalchemy.insert(self.model)
            await self.async_session.execute(stmt, dicts_to_insert)
            await self.async_session.commit()

        return upload_batch_id

    async def get_upload_history(self) -> list[dict]:
        stmt = (
            sqlalchemy.select(
                self.model.upload_batch_id,
                self.model.reporting_year,
                self.model.reporting_month,
                self.model.zona,
                sqlalchemy_functions.min(self.model.created_at).label("upload_date"),
                sqlalchemy_functions.count(self.model.id).label("record_count"),
            )
            .group_by(
                self.model.upload_batch_id, self.model.reporting_year,
                self.model.reporting_month, self.model.zona
            )
            .order_by(sqlalchemy.desc("upload_date"))
        )
        res = await self.async_session.execute(stmt)
        return [dict(row._mapping) for row in res.all()]

    async def get_data(
        self,
        batch_id: str | None = None,
        year: int | None = None,
        period: int | None = None,
        month: int | None = None,
        quarter: int | None = None,
        field: str | None = None,
    ) -> list[typing.Any]:
        stmt = sqlalchemy.select(self.model)
        conditions = []
        if batch_id:
            conditions.append(self.model.upload_batch_id == batch_id)
        if year:
            conditions.append(self.model.reporting_year == year)
        filter_month = period or month
        if filter_month:
            conditions.append(self.model.reporting_month == filter_month)
        if field:  # zona
            conditions.append(self.model.zona == field)
        if conditions:
            stmt = stmt.where(sqlalchemy.and_(*conditions))
        stmt = stmt.order_by(sqlalchemy.desc(self.model.created_at))
        # ponytail: safety cap, not real pagination — see base_monitoring.get_data.
        stmt = stmt.limit(5000)
        res = await self.async_session.execute(stmt)
        return list(res.scalars().all())
