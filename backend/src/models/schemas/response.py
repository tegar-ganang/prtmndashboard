import typing

from src.models.schemas.base import BaseSchemaModel


class APIResponse(BaseSchemaModel):
    success: bool
    message: str
    data: typing.Any | None = None
    err: typing.Any | None = None
