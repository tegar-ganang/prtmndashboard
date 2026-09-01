import datetime
import decimal
import uuid

import sqlalchemy
from sqlalchemy.orm import Mapped as SQLAlchemyMapped, mapped_column as sqlalchemy_mapped_column
from sqlalchemy.sql import functions as sqlalchemy_functions

from src.repository.table import Base


class ProjectProgressSummary(Base):  # type: ignore
    """
    Baris per-tanggal (weekly) dari sheet 'S-Overall' (row 58/59 = tanggal, row
    64/65/66/67/70 = ACTUAL THIS WEEK / ACTUAL CUMMULATIVE / PLAN THIS WEEK /
    PLAN CUMMULATIVE / VARIANCE TO PLAN), ditranspose jadi 1 baris per tanggal.
    Setiap tanggal di-upsert (bukan replace) karena satu file berisi seluruh
    rentang tanggal project — minggu yang sudah lewat bisa saja direvisi
    (mis. actual yang tadinya kosong terisi) di laporan minggu berikutnya.
    """

    __tablename__ = "project_progress_summary"

    id: SQLAlchemyMapped[str] = sqlalchemy_mapped_column(sqlalchemy.Uuid, primary_key=True, default=uuid.uuid4)
    project_id: SQLAlchemyMapped[str] = sqlalchemy_mapped_column(
        sqlalchemy.ForeignKey("project.id", ondelete="CASCADE"), nullable=False
    )
    progress_date: SQLAlchemyMapped[datetime.date] = sqlalchemy_mapped_column(sqlalchemy.Date, nullable=False)

    actual_this_week: SQLAlchemyMapped[decimal.Decimal | None] = sqlalchemy_mapped_column(
        sqlalchemy.Numeric(10, 2), nullable=True
    )
    actual_cumulative: SQLAlchemyMapped[decimal.Decimal | None] = sqlalchemy_mapped_column(
        sqlalchemy.Numeric(10, 2), nullable=True
    )
    plan_this_week: SQLAlchemyMapped[decimal.Decimal | None] = sqlalchemy_mapped_column(
        sqlalchemy.Numeric(10, 2), nullable=True
    )
    plan_cumulative: SQLAlchemyMapped[decimal.Decimal | None] = sqlalchemy_mapped_column(
        sqlalchemy.Numeric(10, 2), nullable=True
    )
    variance_to_plan: SQLAlchemyMapped[decimal.Decimal | None] = sqlalchemy_mapped_column(
        sqlalchemy.Numeric(10, 2), nullable=True
    )

    created_at: SQLAlchemyMapped[datetime.datetime] = sqlalchemy_mapped_column(
        sqlalchemy.DateTime(timezone=True), nullable=False, server_default=sqlalchemy_functions.now()
    )
    updated_at: SQLAlchemyMapped[datetime.datetime] = sqlalchemy_mapped_column(
        sqlalchemy.DateTime(timezone=True),
        nullable=True,
        server_onupdate=sqlalchemy.schema.FetchedValue(for_update=True),
    )

    __table_args__ = (
        sqlalchemy.UniqueConstraint("project_id", "progress_date", name="UQ_project_progress_summary"),
    )

    __mapper_args__ = {"eager_defaults": True}
