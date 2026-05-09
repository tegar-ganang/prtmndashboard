import datetime
import uuid

import sqlalchemy
from sqlalchemy.orm import Mapped as SQLAlchemyMapped, mapped_column as sqlalchemy_mapped_column, relationship
from sqlalchemy.sql import functions as sqlalchemy_functions

from src.repository.table import Base

class MIT(Base):  # type: ignore
    __tablename__ = "mit_monitoring"

    id: SQLAlchemyMapped[str] = sqlalchemy_mapped_column(sqlalchemy.Uuid, primary_key=True, default=uuid.uuid4)
    upload_batch_id: SQLAlchemyMapped[str] = sqlalchemy_mapped_column(sqlalchemy.Uuid, nullable=False)
    owner_account_id: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(
        sqlalchemy.Uuid, sqlalchemy.ForeignKey("account.id"), nullable=True
    )
    
    # 1. No Registration Breakdown
    area: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=100), nullable=True)
    reg_lokasi: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=50), nullable=True)
    reg_jenis_mit: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=50), nullable=True)
    reg_kategori: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=50), nullable=True)
    reg_tahun: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=10), nullable=True)
    reg_no: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=50), nullable=True)
    
    # 2. Information & Scenario
    mit_declaration_date: SQLAlchemyMapped[datetime.date | None] = sqlalchemy_mapped_column(sqlalchemy.Date, nullable=True)
    mit_title_asset: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=255), nullable=True)
    integrity_threats: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=None), nullable=True) # nvarchar(max)
    possible_scenario: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=None), nullable=True)
    consequences: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=None), nullable=True)
    available_safeguard: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=None), nullable=True)
    
    # 3. Current Risk Assessment
    current_likelihood: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=50), nullable=True)
    current_severity: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=50), nullable=True)
    current_risk_rating: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=100), nullable=True)
    
    # 4. Recommendations
    rec_no: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=100), nullable=True)
    recommendation_action: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=None), nullable=True)
    pic: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=255), nullable=True)
    target_closing: SQLAlchemyMapped[datetime.date | None] = sqlalchemy_mapped_column(sqlalchemy.Date, nullable=True)
    remarks: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=None), nullable=True)
    
    # 5. Target Risk (Post-Recommendation)
    target_likelihood: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=50), nullable=True)
    target_severity: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=50), nullable=True)
    target_risk_rating: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=100), nullable=True)
    
    # 6. Status & Validation
    mit_status: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=100), nullable=True)
    evidence_path: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=None), nullable=True)
    closing_date: SQLAlchemyMapped[datetime.date | None] = sqlalchemy_mapped_column(sqlalchemy.Date, nullable=True)
    
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
