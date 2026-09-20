import typing
from src.models.schemas.base import BaseSchemaModel


class MartSyncCountRow(BaseSchemaModel):
    """1 baris perbandingan jumlah data: schema app vs schema mart_pertamina."""
    id: typing.Any
    name: str
    app_table: str
    app_count: typing.Optional[int]
    app_error: typing.Optional[str]
    expected_mart_count: typing.Optional[int]
    mart_table: str
    mart_count: typing.Optional[int]
    mart_error: typing.Optional[str]


class MartSyncRunResult(BaseSchemaModel):
    """Hasil eksekusi 1 sync_script."""
    name: str
    sync_script: str
    success: bool
    error: typing.Optional[str]
