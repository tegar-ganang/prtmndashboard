import uuid
import datetime

import sqlalchemy
from sqlalchemy.orm import Mapped as SQLAlchemyMapped, mapped_column as sqlalchemy_mapped_column
from sqlalchemy.sql import functions as sqlalchemy_functions

from src.repository.table import Base


class MartSyncJob(Base):
    """
    Daftar tabel yang disinkronkan ke schema mart_pertamina.

    Dipakai oleh halaman admin "Log Data" untuk:
      1. Membandingkan jumlah baris antara schema app (app_table) dan
         schema mart_pertamina (mart_table).
      2. Tombol "Sync Data" — loop tiap baris (urut sort_order) lalu
         menjalankan sync_script (mis. "EXEC mart_pertamina.sp_sync_mit;").

    Baris baru bisa ditambahkan langsung ke tabel ini (lewat SQL) setiap
    kali ada stored procedure sync baru, tanpa perlu ubah kode.
    """
    __tablename__ = "mart_sync_job"

    id: SQLAlchemyMapped[str] = sqlalchemy_mapped_column(
        sqlalchemy.Uuid, primary_key=True, default=uuid.uuid4
    )
    name: SQLAlchemyMapped[str] = sqlalchemy_mapped_column(sqlalchemy.String(length=100), nullable=False)
    app_table: SQLAlchemyMapped[str] = sqlalchemy_mapped_column(sqlalchemy.String(length=128), nullable=False)
    mart_table: SQLAlchemyMapped[str] = sqlalchemy_mapped_column(sqlalchemy.String(length=128), nullable=False)
    sync_script: SQLAlchemyMapped[str] = sqlalchemy_mapped_column(sqlalchemy.String(length=None), nullable=False)
    sort_order: SQLAlchemyMapped[int] = sqlalchemy_mapped_column(sqlalchemy.Integer, nullable=False, default=0)
    is_active: SQLAlchemyMapped[bool] = sqlalchemy_mapped_column(sqlalchemy.Boolean, nullable=False, default=True)

    created_at: SQLAlchemyMapped[datetime.datetime] = sqlalchemy_mapped_column(
        sqlalchemy.DateTime(timezone=True), nullable=False, server_default=sqlalchemy_functions.now()
    )
    updated_at: SQLAlchemyMapped[datetime.datetime | None] = sqlalchemy_mapped_column(
        sqlalchemy.DateTime(timezone=True),
        nullable=True,
        server_onupdate=sqlalchemy.schema.FetchedValue(for_update=True),
    )

    __mapper_args__ = {"eager_defaults": True}
