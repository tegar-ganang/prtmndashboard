import typing

import sqlalchemy
from sqlalchemy.orm import DeclarativeBase


class DBTable(DeclarativeBase):
    metadata: sqlalchemy.MetaData = sqlalchemy.MetaData(schema="app")  # type: ignore


Base: typing.Type[DeclarativeBase] = DBTable
