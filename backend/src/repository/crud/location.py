import sqlalchemy
from src.models.db.location import FieldLocation
from src.repository.crud.base import BaseCRUDRepository

class FieldLocationCRUDRepository(BaseCRUDRepository):
    async def get_all_locations(self) -> list[FieldLocation]:
        stmt = sqlalchemy.select(FieldLocation).order_by(FieldLocation.name.asc())
        res = await self.async_session.execute(stmt)
        return list(res.scalars().all())
