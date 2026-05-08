import sqlalchemy
from sqlalchemy.orm import Mapped as SQLAlchemyMapped, mapped_column as sqlalchemy_mapped_column

from src.repository.table import Base


class Role(Base):  # type: ignore
    __tablename__ = "role"

    id: SQLAlchemyMapped[int] = sqlalchemy_mapped_column(sqlalchemy.Integer, primary_key=True, autoincrement=True)
    role_name: SQLAlchemyMapped[str] = sqlalchemy_mapped_column(sqlalchemy.String(length=50), nullable=False)
    description: SQLAlchemyMapped[str | None] = sqlalchemy_mapped_column(sqlalchemy.String(length=255), nullable=True)

