import sqlalchemy
from sqlalchemy.orm import Mapped as SQLAlchemyMapped, mapped_column as sqlalchemy_mapped_column

from src.repository.table import Base

class Menu(Base):  # type: ignore
    __tablename__ = "menu"

    id: SQLAlchemyMapped[int] = sqlalchemy_mapped_column(sqlalchemy.Integer, primary_key=True, autoincrement=True)
    menu_name: SQLAlchemyMapped[str] = sqlalchemy_mapped_column(sqlalchemy.String(length=50), nullable=False)
