import datetime
import uuid

import sqlalchemy
from sqlalchemy.orm import Mapped as SQLAlchemyMapped, mapped_column as sqlalchemy_mapped_column
from sqlalchemy.sql import functions as sqlalchemy_functions

from src.repository.table import Base


class ProjectScurveUpload(Base):  # type: ignore
    """History of every S-curve Excel uploaded for a project — kept forever, unlike
    project_progress/project_progress_summary which only hold the latest figures."""

    __tablename__ = "project_scurve_upload"

    id: SQLAlchemyMapped[str] = sqlalchemy_mapped_column(sqlalchemy.Uuid, primary_key=True, default=uuid.uuid4)
    project_id: SQLAlchemyMapped[str] = sqlalchemy_mapped_column(
        sqlalchemy.ForeignKey("project.id", ondelete="CASCADE"), nullable=False
    )
    file_name: SQLAlchemyMapped[str] = sqlalchemy_mapped_column(sqlalchemy.String(length=255), nullable=False)
    file_path: SQLAlchemyMapped[str] = sqlalchemy_mapped_column(sqlalchemy.String(length=500), nullable=False)
    uploaded_by_account_id: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(
        sqlalchemy.ForeignKey("account.id", ondelete="SET NULL"), nullable=True
    )
    uploaded_at: SQLAlchemyMapped[datetime.datetime] = sqlalchemy_mapped_column(
        sqlalchemy.DateTime(timezone=True), nullable=False, server_default=sqlalchemy_functions.now()
    )

    __mapper_args__ = {"eager_defaults": True}
