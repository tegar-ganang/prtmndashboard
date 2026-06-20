import typing
import uuid
from datetime import datetime, date

import sqlalchemy
from sqlalchemy.sql import functions as sqlalchemy_functions

from src.models.db.zona_indicator import ZonaIndicator
from src.repository.crud.base_monitoring import BaseMonitoringRepository, parse_date


ZONA_INDICATOR_MAPPER = {
    "IND TYPE": "ind_type",
    "INDICATOR": "indicator",
    "UNIT": "unit",
    "DESCRIPTION": "description",
    "BASIS": "basis",
    "PIC Name": "pic_name",
    "PIC Email": "pic_email",
    "January": "jan",
    "February": "feb",
    "March": "mar",
    "April": "apr",
    "May": "may",
    "June": "jun",
    "July": "jul",
    "August": "aug",
    "September": "sep",
    "October": "oct",
    "November": "nov",
    "December": "dec",
    "YTD": "ytd",
    "Comment": "comment",
}

NUMERIC_COLUMNS = {"jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec", "ytd"}


def _parse_numeric(value: typing.Any) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


class ZonaIndicatorCRUDRepository(BaseMonitoringRepository):
    model = ZonaIndicator
    mapper = ZONA_INDICATOR_MAPPER
    period_col = "reporting_year"

    async def check_period_exists(self, year: int, period: int, field: str | None = None) -> bool:
        """Override: for zona indicator, period = year and we check zona instead of field."""
        zona = field  # reuse 'field' parameter as 'zona' for compatibility
        conditions = [self.model.reporting_year == year]
        if zona is not None:
            conditions.append(self.model.zona == zona)
        stmt = sqlalchemy.select(self.model.id).where(*conditions).limit(1)
        res = await self.async_session.execute(stmt)
        return res.first() is not None

    async def create_batch(self, batch_data: typing.Any, owner_account_id: str) -> str:
        upload_batch_id = str(uuid.uuid4())
        zona_value: str | None = getattr(batch_data, "zona", None)

        if batch_data.mode == "overwrite":
            conditions = [self.model.reporting_year == batch_data.reporting_year]
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
                "zona": zona_value,
                "upload_batch_id": upload_batch_id,
                "owner_account_id": owner_account_id,
            }

            for excel_header, db_column in self.mapper.items():
                value = item.get(excel_header)
                if db_column in NUMERIC_COLUMNS:
                    kwargs[db_column] = _parse_numeric(value)
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
                self.model.zona,
                sqlalchemy_functions.min(self.model.created_at).label("upload_date"),
                sqlalchemy_functions.count(self.model.id).label("record_count"),
            )
            .group_by(self.model.upload_batch_id, self.model.reporting_year, self.model.zona)
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
        if field:  # zona passed as field for consistency
            conditions.append(self.model.zona == field)
        if conditions:
            stmt = stmt.where(sqlalchemy.and_(*conditions))
        stmt = stmt.order_by(sqlalchemy.desc(self.model.created_at))
        res = await self.async_session.execute(stmt)
        return list(res.scalars().all())
