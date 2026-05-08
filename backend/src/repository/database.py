import pydantic
from sqlalchemy.ext.asyncio import (
    async_sessionmaker as sqlalchemy_async_sessionmaker,
    AsyncEngine as SQLAlchemyAsyncEngine,
    AsyncSession as SQLAlchemyAsyncSession,
    create_async_engine as create_sqlalchemy_async_engine,
)
from sqlalchemy.pool import Pool as SQLAlchemyPool

from src.config.manager import settings


class AsyncDatabase:
    def __init__(self):
        # We assemble the URI directly as a string for MSSQL to avoid PostgresDsn validation
        self.postgres_uri: str = (
            f"{settings.DB_POSTGRES_SCHEMA}://{settings.DB_POSTGRES_USERNAME}:{settings.DB_POSTGRES_PASSWORD}"
            f"@{settings.DB_POSTGRES_HOST}:{settings.DB_POSTGRES_PORT}/{settings.DB_POSTGRES_NAME}"
        )
        self.async_engine: SQLAlchemyAsyncEngine = create_sqlalchemy_async_engine(
            url=self.set_async_db_uri,
            echo=settings.IS_DB_ECHO_LOG,
            pool_size=settings.DB_POOL_SIZE,
            max_overflow=settings.DB_POOL_OVERFLOW,
            pool_pre_ping=True,
            pool_recycle=3600,
        )
        self.async_session: SQLAlchemyAsyncSession = SQLAlchemyAsyncSession(bind=self.async_engine)
        self.pool: SQLAlchemyPool = self.async_engine.pool

    @property
    def set_async_db_uri(self) -> str:
        """
        Return the asynchronous database string for MS SQL Server using aioodbc.
        """
        # Return the URI appending driver configuration suitable for msodbcsql18
        if "mssql" in self.postgres_uri and "?" not in self.postgres_uri:
            return f"{self.postgres_uri}?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes"
        return self.postgres_uri


async_db: AsyncDatabase = AsyncDatabase()
