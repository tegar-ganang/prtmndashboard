import uuid
from src.models.schemas.base import BaseSchemaModel

class FieldLocationResponse(BaseSchemaModel):
    id: uuid.UUID
    code: str
    name: str
    description: str | None
