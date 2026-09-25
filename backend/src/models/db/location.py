import uuid
import datetime
from typing import TYPE_CHECKING

import sqlalchemy
from sqlalchemy.orm import Mapped as SQLAlchemyMapped, mapped_column as sqlalchemy_mapped_column, relationship
from sqlalchemy.sql import functions as sqlalchemy_functions

from src.repository.table import Base

if TYPE_CHECKING:
    from src.models.db.hazid import Hazid
    from src.models.db.hazop import Hazop
    from src.models.db.lopa import Lopa
    from src.models.db.mit import MIT
    from src.models.db.produksi import Produksi

class FieldLocation(Base):
    __tablename__ = "field_location"

    id: SQLAlchemyMapped[str] = sqlalchemy_mapped_column(sqlalchemy.Uuid, primary_key=True, default=uuid.uuid4)
    code: SQLAlchemyMapped[str] = sqlalchemy_mapped_column(sqlalchemy.String(length=50), nullable=False, unique=True)
    name: SQLAlchemyMapped[str] = sqlalchemy_mapped_column(sqlalchemy.String(length=100), nullable=False)
    description: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=255), nullable=True)
    created_at: SQLAlchemyMapped[datetime.datetime] = sqlalchemy_mapped_column(
        sqlalchemy.DateTime(timezone=True), nullable=False, server_default=sqlalchemy_functions.now()
    )
    updated_at: SQLAlchemyMapped[datetime.datetime | None] = sqlalchemy_mapped_column(
        sqlalchemy.DateTime(timezone=True), nullable=True, onupdate=sqlalchemy_functions.now()
    )

    # lazy="select" (the default): nothing in the codebase reads these
    # collections, but the reverse side (e.g. MIT.field_location) uses
    # back_populates and needs a target to populate. selectin here used to
    # eagerly pull every row of 5 unrelated tables on every /locations call.
    mit_monitorings: SQLAlchemyMapped[list["MIT"]] = relationship(
        "MIT", back_populates="field_location"
    )
    hazid_monitorings: SQLAlchemyMapped[list["Hazid"]] = relationship(
        "Hazid", back_populates="field_location"
    )
    hazop_monitorings: SQLAlchemyMapped[list["Hazop"]] = relationship(
        "Hazop", back_populates="field_location"
    )
    lopa_monitorings: SQLAlchemyMapped[list["Lopa"]] = relationship(
        "Lopa", back_populates="field_location"
    )
    produksi_monitorings: SQLAlchemyMapped[list["Produksi"]] = relationship(
        "Produksi", back_populates="field_location"
    )
