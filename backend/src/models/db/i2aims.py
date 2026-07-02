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

class I2AIMS(Base):  # type: ignore
    __tablename__ = "i2aims_monitoring"

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

    # I2AIMS Fields
    record_id: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=100), nullable=True)
    inspection_date: SQLAlchemyMapped[datetime.date | None] = sqlalchemy_mapped_column(sqlalchemy.Date, nullable=True)
    asset_id: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=100), nullable=True)
    asset_name: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=255), nullable=True)
    asset_type: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=100), nullable=True)
    area: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=100), nullable=True)
    sce_category: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=100), nullable=True)
    integrity_status: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=100), nullable=True)
    inspection_result: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=100), nullable=True)
    inspection_compliance: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=50), nullable=True)
    corrosion_rate: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=50), nullable=True)
    remaining_life: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=50), nullable=True)
    risk_rank: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=50), nullable=True)
    anomaly_count: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=50), nullable=True)
    process_safety_event: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=100), nullable=True)
    barrier_health: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=50), nullable=True)
    recommendation_status: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=100), nullable=True)
    inspection_cost: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=100), nullable=True)

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
