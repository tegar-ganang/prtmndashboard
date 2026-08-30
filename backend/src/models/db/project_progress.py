import datetime
import decimal
import uuid

import sqlalchemy
from sqlalchemy.orm import Mapped as SQLAlchemyMapped, mapped_column as sqlalchemy_mapped_column
from sqlalchemy.sql import functions as sqlalchemy_functions

from src.repository.table import Base


class ProjectProgress(Base):  # type: ignore
    """
    Baris per-item (WBS/discipline) dari sheet 'Exe Sum' (Table 1.1 Discipline Weekly Summary).
    Hanya menyimpan snapshot laporan TERBARU per project — setiap upload baru
    menggantikan (replace) seluruh baris lama project ini, bukan menumpuk histori
    mingguan di sini (histori file-nya ada di project_scurve_upload).
    """

    __tablename__ = "project_progress"

    id: SQLAlchemyMapped[str] = sqlalchemy_mapped_column(sqlalchemy.Uuid, primary_key=True, default=uuid.uuid4)
    project_id: SQLAlchemyMapped[str] = sqlalchemy_mapped_column(
        sqlalchemy.ForeignKey("project.id", ondelete="CASCADE"), nullable=False
    )
    periode_data: SQLAlchemyMapped[datetime.date] = sqlalchemy_mapped_column(sqlalchemy.Date, nullable=False)

    item_no: SQLAlchemyMapped[int] = sqlalchemy_mapped_column(sqlalchemy.SmallInteger, nullable=False)
    description: SQLAlchemyMapped[str] = sqlalchemy_mapped_column(sqlalchemy.String(length=1000), nullable=False)
    wf: SQLAlchemyMapped[decimal.Decimal | None] = sqlalchemy_mapped_column(sqlalchemy.Numeric(10, 2), nullable=True)

    previous_week_plan: SQLAlchemyMapped[decimal.Decimal | None] = sqlalchemy_mapped_column(
        sqlalchemy.Numeric(10, 2), nullable=True
    )
    previous_week_actual: SQLAlchemyMapped[decimal.Decimal | None] = sqlalchemy_mapped_column(
        sqlalchemy.Numeric(10, 2), nullable=True
    )
    previous_week_variance: SQLAlchemyMapped[decimal.Decimal | None] = sqlalchemy_mapped_column(
        sqlalchemy.Numeric(10, 2), nullable=True
    )

    this_week_plan: SQLAlchemyMapped[decimal.Decimal | None] = sqlalchemy_mapped_column(
        sqlalchemy.Numeric(10, 2), nullable=True
    )
    this_week_actual: SQLAlchemyMapped[decimal.Decimal | None] = sqlalchemy_mapped_column(
        sqlalchemy.Numeric(10, 2), nullable=True
    )
    this_week_variance: SQLAlchemyMapped[decimal.Decimal | None] = sqlalchemy_mapped_column(
        sqlalchemy.Numeric(10, 2), nullable=True
    )

    to_date_plan: SQLAlchemyMapped[decimal.Decimal | None] = sqlalchemy_mapped_column(
        sqlalchemy.Numeric(10, 2), nullable=True
    )
    to_date_actual: SQLAlchemyMapped[decimal.Decimal | None] = sqlalchemy_mapped_column(
        sqlalchemy.Numeric(10, 2), nullable=True
    )
    to_date_variance: SQLAlchemyMapped[decimal.Decimal | None] = sqlalchemy_mapped_column(
        sqlalchemy.Numeric(10, 2), nullable=True
    )

    remarks: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=2000), nullable=True)

    created_at: SQLAlchemyMapped[datetime.datetime] = sqlalchemy_mapped_column(
        sqlalchemy.DateTime(timezone=True), nullable=False, server_default=sqlalchemy_functions.now()
    )
    updated_at: SQLAlchemyMapped[datetime.datetime] = sqlalchemy_mapped_column(
        sqlalchemy.DateTime(timezone=True),
        nullable=True,
        server_onupdate=sqlalchemy.schema.FetchedValue(for_update=True),
    )

    __table_args__ = (
        sqlalchemy.UniqueConstraint("project_id", "periode_data", "item_no", name="UQ_project_progress"),
    )

    __mapper_args__ = {"eager_defaults": True}
