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


class ZonaPseList(Base):  # type: ignore
    __tablename__ = "zona_pse_list"

    id: SQLAlchemyMapped[str] = sqlalchemy_mapped_column(sqlalchemy.Uuid, primary_key=True, default=uuid.uuid4)
    upload_batch_id: SQLAlchemyMapped[str] = sqlalchemy_mapped_column(sqlalchemy.Uuid, nullable=False)
    owner_account_id: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(
        sqlalchemy.Uuid, sqlalchemy.ForeignKey("account.id"), nullable=True
    )

    # Period Tracking
    reporting_year: SQLAlchemyMapped[int] = sqlalchemy_mapped_column(sqlalchemy.Integer, nullable=False)
    reporting_month: SQLAlchemyMapped[int] = sqlalchemy_mapped_column(sqlalchemy.SmallInteger, nullable=False)
    zona: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=50), nullable=True)

    # General Data
    no: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=100), nullable=True)
    field_area: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=100), nullable=True)
    lokasi: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=255), nullable=True)
    unit_detail: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=255), nullable=True)
    short_description: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=None), nullable=True)
    event_issue_category: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=255), nullable=True)
    activity: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=255), nullable=True)
    type_location: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=100), nullable=True)
    date_start: SQLAlchemyMapped[datetime.date | None] = sqlalchemy_mapped_column(sqlalchemy.Date, nullable=True)
    time_start: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=20), nullable=True)

    # Barrier / LOPC
    barrier_prevent: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=255), nullable=True)
    barrier_mitigate: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=255), nullable=True)
    lopc_released: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=50), nullable=True)
    lopc_duration_hour: SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Float, nullable=True)
    lopc_flammable_gas_kg: SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Float, nullable=True)
    lopc_gas_one_hour_kg: SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Float, nullable=True)
    liquid_hc_type: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=100), nullable=True)
    lopc_hc_liquid_barrel: SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Float, nullable=True)
    lopc_hc_liquid_one_hour_kg: SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Float, nullable=True)
    toxic_type: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=100), nullable=True)
    lopc_toxic_kg: SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Float, nullable=True)
    lopc_toxic_one_hour_kg: SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Float, nullable=True)
    other_type: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=100), nullable=True)
    lopc_other_kg: SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Float, nullable=True)
    lopc_other_one_hour_kg: SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Float, nullable=True)

    # Injury / Damage
    injured_worker: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=50), nullable=True)
    affect_3rd_party: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=50), nullable=True)
    number_injured_person: SQLAlchemyMapped[int | None] = sqlalchemy_mapped_column(sqlalchemy.Integer, nullable=True)
    number_fatality: SQLAlchemyMapped[int | None] = sqlalchemy_mapped_column(sqlalchemy.Integer, nullable=True)
    fire_explosion: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=50), nullable=True)
    damage_fire_explosion_usd: SQLAlchemyMapped[float | None] = sqlalchemy_mapped_column(sqlalchemy.Float, nullable=True)

    # Relief Device
    relief_device: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=100), nullable=True)
    effect_relief_device: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=255), nullable=True)
    pse_tier: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=50), nullable=True)

    # Causal Factor 1
    causal_1_desc: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=None), nullable=True)
    causal_1_category: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=255), nullable=True)
    causal_1_sub_category: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=255), nullable=True)

    # Causal Factor 2
    causal_2_desc: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=None), nullable=True)
    causal_2_category: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=255), nullable=True)
    causal_2_sub_category: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=255), nullable=True)

    # Causal Factor 3
    causal_3_desc: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=None), nullable=True)
    causal_3_category: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=255), nullable=True)
    causal_3_sub_category: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=255), nullable=True)

    # Barrier 1 Failure
    barrier_1_desc: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=None), nullable=True)
    barrier_1_category: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=255), nullable=True)
    barrier_1_sub_category: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=255), nullable=True)

    # Barrier 2 Failure
    barrier_2_desc: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=None), nullable=True)
    barrier_2_category: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=255), nullable=True)
    barrier_2_sub_category: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=255), nullable=True)

    # Barrier 3 Failure
    barrier_3_desc: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=None), nullable=True)
    barrier_3_category: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=255), nullable=True)
    barrier_3_sub_category: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=255), nullable=True)

    remarks: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=None), nullable=True)

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
