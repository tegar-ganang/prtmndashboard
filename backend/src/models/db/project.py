import datetime
import uuid

import sqlalchemy
from sqlalchemy.orm import Mapped as SQLAlchemyMapped, mapped_column as sqlalchemy_mapped_column
from sqlalchemy.sql import functions as sqlalchemy_functions

from src.repository.table import Base


class Project(Base):  # type: ignore
    __tablename__ = "project"

    id: SQLAlchemyMapped[str] = sqlalchemy_mapped_column(sqlalchemy.Uuid, primary_key=True, default=uuid.uuid4)
    owner_account_id: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(
        sqlalchemy.ForeignKey("account.id", ondelete="SET NULL"), nullable=True
    )
    document_created_at: SQLAlchemyMapped[datetime.date] = sqlalchemy_mapped_column(sqlalchemy.Date, nullable=False)
    operational_start_date: SQLAlchemyMapped[datetime.date] = sqlalchemy_mapped_column(sqlalchemy.Date, nullable=False)
    estimated_completion_date: SQLAlchemyMapped[datetime.date] = sqlalchemy_mapped_column(
        sqlalchemy.Date, nullable=False
    )
    project_name: SQLAlchemyMapped[str] = sqlalchemy_mapped_column(sqlalchemy.String(length=150), nullable=False)
    project_location: SQLAlchemyMapped[str] = sqlalchemy_mapped_column(sqlalchemy.String(length=255), nullable=False)
    project_value: SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Float, nullable=True)
    project_priority: SQLAlchemyMapped[str] = sqlalchemy_mapped_column(sqlalchemy.String(length=10), nullable=False)
    estimated_progress_percentage: SQLAlchemyMapped[float] = sqlalchemy_mapped_column(
        sqlalchemy.Float, nullable=False, default=0.0
    )
    earned_value_ev: SQLAlchemyMapped[float] = sqlalchemy_mapped_column(sqlalchemy.Float, nullable=False, default=0.0)
    planned_value_pv: SQLAlchemyMapped[float] = sqlalchemy_mapped_column(sqlalchemy.Float, nullable=False, default=0.0)
    actual_cost_ac: SQLAlchemyMapped[float] = sqlalchemy_mapped_column(sqlalchemy.Float, nullable=False, default=0.0)
    budget_bac: SQLAlchemyMapped[float] = sqlalchemy_mapped_column(sqlalchemy.Float, nullable=False, default=0.0)
    milestone_and_work_stages: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.Text, nullable=True)
    created_at: SQLAlchemyMapped[datetime.datetime] = sqlalchemy_mapped_column(
        sqlalchemy.DateTime(timezone=True), nullable=False, server_default=sqlalchemy_functions.now()
    )
    updated_at: SQLAlchemyMapped[datetime.datetime] = sqlalchemy_mapped_column(
        sqlalchemy.DateTime(timezone=True),
        nullable=True,
        server_onupdate=sqlalchemy.schema.FetchedValue(for_update=True),
    )

    __mapper_args__ = {"eager_defaults": True}
