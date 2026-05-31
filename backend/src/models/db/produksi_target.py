import uuid
import datetime
import typing
from typing import TYPE_CHECKING

import sqlalchemy
from sqlalchemy.orm import Mapped as SQLAlchemyMapped, mapped_column as sqlalchemy_mapped_column, relationship
from sqlalchemy.sql import functions as sqlalchemy_functions

from src.repository.table import Base

if TYPE_CHECKING:
    from src.models.db.account import Account
    from src.models.db.location import FieldLocation
    from src.models.db.produksi import Produksi


class ProduksiTarget(Base):
    """
    Tabel target bulanan produksi gas (berasal dari Sheet 2 Excel).
    Setiap baris mewakili 1 bulan target untuk suatu field.
    Tabel realisasi harian (produksi_monitoring) berelasi ke tabel ini via FK target_id.
    """
    __tablename__ = "produksi_target"

    id: SQLAlchemyMapped[str] = sqlalchemy_mapped_column(
        sqlalchemy.Uuid, primary_key=True, default=uuid.uuid4
    )
    upload_batch_id: SQLAlchemyMapped[str] = sqlalchemy_mapped_column(
        sqlalchemy.Uuid, nullable=False
    )
    owner_account_id: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(
        sqlalchemy.Uuid, sqlalchemy.ForeignKey("account.id"), nullable=True
    )

    # Periode
    reporting_year: SQLAlchemyMapped[int] = sqlalchemy_mapped_column(
        sqlalchemy.Integer, nullable=False
    )
    reporting_month: SQLAlchemyMapped[int] = sqlalchemy_mapped_column(
        sqlalchemy.SmallInteger, nullable=False
    )
    field: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(
        sqlalchemy.String(length=50),
        sqlalchemy.ForeignKey("field_location.code"),
        nullable=True,
    )

    # Target MMSCFD DMF (Donggi-Matindok Field)
    target_dmf: SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(
        sqlalchemy.Numeric(15, 4), nullable=True
    )

    # Metadata
    created_at: SQLAlchemyMapped[datetime.datetime] = sqlalchemy_mapped_column(
        sqlalchemy.DateTime(timezone=True),
        nullable=False,
        server_default=sqlalchemy_functions.now(),
    )
    updated_at: SQLAlchemyMapped[datetime.datetime] = sqlalchemy_mapped_column(
        sqlalchemy.DateTime(timezone=True),
        nullable=True,
        server_onupdate=sqlalchemy.schema.FetchedValue(for_update=True),
    )

    # Relationships
    owner: SQLAlchemyMapped[typing.Optional["Account"]] = relationship(
        "Account", lazy="selectin"
    )
    field_location: SQLAlchemyMapped[typing.Optional["FieldLocation"]] = relationship(
        "FieldLocation", lazy="selectin"
    )
    realisasi_rows: SQLAlchemyMapped[typing.List["Produksi"]] = relationship(
        "Produksi", back_populates="target", lazy="selectin"
    )

    __mapper_args__ = {"eager_defaults": True}
