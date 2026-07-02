import datetime
import uuid
import typing
from typing import TYPE_CHECKING

import sqlalchemy
from sqlalchemy.orm import Mapped as SQLAlchemyMapped, mapped_column as sqlalchemy_mapped_column, relationship
from sqlalchemy.sql import functions as sqlalchemy_functions

if TYPE_CHECKING:
    from src.models.db.account import Account

from src.repository.table import Base

class AIRMS(Base):  # type: ignore
    __tablename__ = "airms_monitoring"

    id: SQLAlchemyMapped[str] = sqlalchemy_mapped_column(sqlalchemy.Uuid, primary_key=True, default=uuid.uuid4)
    upload_batch_id: SQLAlchemyMapped[str] = sqlalchemy_mapped_column(sqlalchemy.Uuid, nullable=False)
    owner_account_id: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(
        sqlalchemy.Uuid, sqlalchemy.ForeignKey("account.id"), nullable=True
    )

    # Period Tracking
    reporting_year: SQLAlchemyMapped[int] = sqlalchemy_mapped_column(sqlalchemy.Integer, nullable=False)
    reporting_month: SQLAlchemyMapped[int] = sqlalchemy_mapped_column(sqlalchemy.SmallInteger, nullable=False)
    field: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(
        sqlalchemy.String(length=50), nullable=True
    )

    # AIRMS Fields
    record_id: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=100), nullable=True)
    date: SQLAlchemyMapped[datetime.date | None] = sqlalchemy_mapped_column(sqlalchemy.Date, nullable=True)
    asset_id: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=100), nullable=True)
    asset_name: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=255), nullable=True)
    area: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=100), nullable=True)
    availability: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=50), nullable=True)
    reliability: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=50), nullable=True)
    mtbf: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=50), nullable=True)
    mttr: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=50), nullable=True)
    wo_type: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=100), nullable=True)
    wo_status: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=100), nullable=True)
    maintenance_cost: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=100), nullable=True)
    downtime_type: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=100), nullable=True)
    downtime_hours: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=50), nullable=True)
    lost_boe: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=50), nullable=True)
    health_index: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=50), nullable=True)

    # Metadata
    created_at: SQLAlchemyMapped[datetime.datetime] = sqlalchemy_mapped_column(
        sqlalchemy.DateTime(timezone=True), nullable=False, server_default=sqlalchemy_functions.now()
    )
    updated_at: SQLAlchemyMapped[datetime.datetime] = sqlalchemy_mapped_column(
        sqlalchemy.DateTime(timezone=True),
        nullable=True,
        server_onupdate=sqlalchemy.schema.FetchedValue(for_update=True),
    )

    owner: SQLAlchemyMapped["Account"] = relationship("Account", lazy="selectin")

    __mapper_args__ = {"eager_defaults": True}
