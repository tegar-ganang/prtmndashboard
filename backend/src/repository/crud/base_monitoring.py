import typing
import uuid
from datetime import datetime, date

import sqlalchemy
from sqlalchemy.sql import functions as sqlalchemy_functions

from src.repository.crud.base import BaseCRUDRepository

def parse_date(date_val: typing.Any) -> date | None:
    if not date_val:
        return None
    if isinstance(date_val, (datetime, date)):
        return date_val if isinstance(date_val, date) else date_val.date()
    
    date_str = str(date_val).strip()
    if not date_str:
        return None
    
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%Y"):
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue
    return None

class BaseMonitoringRepository(BaseCRUDRepository):
    model: typing.Any = None
    mapper: dict[str, str] = {}
    date_columns: list[str] = ["target_date", "completion_date", "mit_declaration_date", "target_closing", "closing_date"]
    period_col: str = "reporting_month" # default for most

    async def check_period_exists(self, year: int, period: int) -> bool:
        period_attr = getattr(self.model, self.period_col)
        stmt = sqlalchemy.select(self.model.id).where(
            self.model.reporting_year == year,
            period_attr == period
        ).limit(1)
        res = await self.async_session.execute(stmt)
        return res.first() is not None

    async def create_batch(self, batch_data: typing.Any, owner_account_id: str) -> str:
        upload_batch_id = str(uuid.uuid4())
        
        # Determine period value based on input schema (reporting_quarter or reporting_month)
        period_value = getattr(batch_data, self.period_col)

        if batch_data.mode == "overwrite":
            period_attr = getattr(self.model, self.period_col)
            delete_stmt = sqlalchemy.delete(self.model).where(
                self.model.reporting_year == batch_data.reporting_year,
                period_attr == period_value
            )
            await self.async_session.execute(delete_stmt)
            await self.async_session.flush()

        objects = []
        for item in batch_data.items:
            kwargs = {
                "reporting_year": batch_data.reporting_year,
                self.period_col: period_value,
                "upload_batch_id": upload_batch_id,
                "owner_account_id": owner_account_id,
            }
            
            for excel_header, db_column in self.mapper.items():
                value = item.get(excel_header)
                if db_column in self.date_columns:
                    kwargs[db_column] = parse_date(value)
                else:
                    kwargs[db_column] = str(value) if value is not None else None
            
            obj = self.model(**kwargs)
            objects.append(obj)
            
        if objects:
            self.async_session.add_all(objects)
            await self.async_session.commit()
            
        return upload_batch_id

    async def get_upload_history(self) -> list[dict]:
        period_attr = getattr(self.model, self.period_col)
        stmt = (
            sqlalchemy.select(
                self.model.upload_batch_id,
                self.model.reporting_year,
                period_attr.label(self.period_col),
                sqlalchemy_functions.min(self.model.created_at).label("upload_date"),
                sqlalchemy_functions.count(self.model.id).label("record_count"),
            )
            .group_by(self.model.upload_batch_id, self.model.reporting_year, period_attr)
            .order_by(sqlalchemy.desc("upload_date"))
        )
        res = await self.async_session.execute(stmt)
        return [dict(row._mapping) for row in res.all()]

    async def get_data(
        self, batch_id: str | None = None, year: int | None = None, period: int | None = None
    ) -> list[typing.Any]:
        stmt = sqlalchemy.select(self.model)
        
        conditions = []
        if batch_id:
            conditions.append(self.model.upload_batch_id == batch_id)
        if year:
            conditions.append(self.model.reporting_year == year)
        if period:
            period_attr = getattr(self.model, self.period_col)
            conditions.append(period_attr == period)
            
        if conditions:
            stmt = stmt.where(sqlalchemy.and_(*conditions))
            
        stmt = stmt.order_by(sqlalchemy.desc(self.model.created_at))
        
        res = await self.async_session.execute(stmt)
        return list(res.scalars().all())
