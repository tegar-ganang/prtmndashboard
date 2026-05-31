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
    from src.models.db.produksi_target import ProduksiTarget


class Produksi(Base):
    """
    Tabel realisasi harian produksi gas (berasal dari Sheet 1 Excel).
    Dihubungkan ke tabel produksi_target (Sheet 2) melalui FK target_id.
    """
    __tablename__ = "produksi_monitoring"

    id: SQLAlchemyMapped[str] = sqlalchemy_mapped_column(sqlalchemy.Uuid, primary_key=True, default=uuid.uuid4)
    upload_batch_id: SQLAlchemyMapped[str] = sqlalchemy_mapped_column(sqlalchemy.Uuid, nullable=False)
    owner_account_id: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(
        sqlalchemy.Uuid, sqlalchemy.ForeignKey("account.id"), nullable=True
    )

    # Foreign Key ke tabel target bulanan
    target_id: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(
        sqlalchemy.Uuid, sqlalchemy.ForeignKey("produksi_target.id", ondelete="SET NULL"), nullable=True
    )

    # Period Tracking
    reporting_year: SQLAlchemyMapped[int] = sqlalchemy_mapped_column(sqlalchemy.Integer, nullable=False)
    reporting_month: SQLAlchemyMapped[int] = sqlalchemy_mapped_column(sqlalchemy.SmallInteger, nullable=False)
    field: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(
        sqlalchemy.String(length=50), sqlalchemy.ForeignKey("field_location.code"), nullable=True
    )

    # ── Sheet 1: Tanggal ──────────────────────────────────────────────────────
    tanggal: SQLAlchemyMapped[datetime.date] = sqlalchemy_mapped_column(sqlalchemy.Date, nullable=False)

    # ── Sheet 1: ANGKA PRODUKSI PUPO / SOT (BOPD) ────────────────────────────
    pupo_sot_target:   SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Numeric(15, 4), nullable=True)
    pupo_sot_real:     SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Numeric(15, 4), nullable=True)
    pupo_sot_donggi:   SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Numeric(15, 4), nullable=True)
    pupo_sot_matindok: SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Numeric(15, 4), nullable=True)

    # ── Sheet 1: ANGKA PRODUKSI OPERASI (BOPD) ───────────────────────────────
    op_target:         SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Numeric(15, 4), nullable=True)
    op_real:           SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Numeric(15, 4), nullable=True)
    op_donggi:         SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Numeric(15, 4), nullable=True)
    op_matindok:       SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Numeric(15, 4), nullable=True)

    # ── Sheet 1: PRODUKSI GAS MMSCFD – DONGGI FIELD ──────────────────────────
    donggi_prod:       SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Numeric(15, 4), nullable=True)
    donggi_own_use:    SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Numeric(15, 4), nullable=True)
    donggi_sales:      SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Numeric(15, 4), nullable=True)
    donggi_main_flare: SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Numeric(15, 4), nullable=True)
    donggi_acid_flare: SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Numeric(15, 4), nullable=True)
    donggi_venting_co2:SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Numeric(15, 4), nullable=True)
    donggi_losses:     SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Numeric(15, 4), nullable=True)

    # ── Sheet 1: PRODUKSI GAS MMSCFD – MATINDOK FIELD ────────────────────────
    matindok_prod:       SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Numeric(15, 4), nullable=True)
    matindok_own_use:    SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Numeric(15, 4), nullable=True)
    matindok_sales:      SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Numeric(15, 4), nullable=True)
    matindok_main_flare: SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Numeric(15, 4), nullable=True)
    matindok_acid_flare: SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Numeric(15, 4), nullable=True)
    matindok_venting_co2:SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Numeric(15, 4), nullable=True)
    matindok_losses:     SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Numeric(15, 4), nullable=True)

    # ── Sheet 1: BBLS – DONGGI MATINDOK FIELD ────────────────────────────────
    bbls_processed_water:  SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Numeric(15, 4), nullable=True)
    bbls_water_injection:  SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Numeric(15, 4), nullable=True)
    bbls_closing_stock:    SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Numeric(15, 4), nullable=True)

    # ── Sheet 1: SAFE MAN HOURS ───────────────────────────────────────────────
    safe_man_hours_actl: SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Numeric(15, 4), nullable=True)
    safe_man_hours_dmf:  SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Numeric(15, 4), nullable=True)

    # Metadata
    created_at: SQLAlchemyMapped[datetime.datetime] = sqlalchemy_mapped_column(
        sqlalchemy.DateTime(timezone=True), nullable=False, server_default=sqlalchemy_functions.now()
    )
    updated_at: SQLAlchemyMapped[datetime.datetime] = sqlalchemy_mapped_column(
        sqlalchemy.DateTime(timezone=True),
        nullable=True,
        server_onupdate=sqlalchemy.schema.FetchedValue(for_update=True),
    )

    # Relationships
    owner: SQLAlchemyMapped["Account"] = relationship("Account", lazy="selectin")
    field_location: SQLAlchemyMapped[typing.Optional["FieldLocation"]] = relationship(
        "FieldLocation", back_populates="produksi_monitorings", lazy="selectin"
    )
    target: SQLAlchemyMapped[typing.Optional["ProduksiTarget"]] = relationship(
        "ProduksiTarget", back_populates="realisasi_rows", lazy="selectin"
    )

    __mapper_args__ = {"eager_defaults": True}
