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

class MOC(Base):  # type: ignore
    __tablename__ = "moc_monitoring"

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

    # MOC Fields
    moc_number: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=50), nullable=True)
    change_desc: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=None), nullable=True)
    issued_date: SQLAlchemyMapped[datetime.date | None] = sqlalchemy_mapped_column(sqlalchemy.Date, nullable=True)
    done: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=50), nullable=True)
    moc_owner: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=255), nullable=True)
    last_updated: SQLAlchemyMapped[datetime.date | None] = sqlalchemy_mapped_column(sqlalchemy.Date, nullable=True)
    ongoing_step: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=100), nullable=True)
    pic: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=255), nullable=True)
    status: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=100), nullable=True)

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
