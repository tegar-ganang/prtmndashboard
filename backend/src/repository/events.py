import os

import fastapi
import loguru
import sqlalchemy
from sqlalchemy import event
from sqlalchemy.dialects.postgresql.asyncpg import AsyncAdapt_asyncpg_connection
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncSessionTransaction
from sqlalchemy.pool.base import _ConnectionRecord

from sqlalchemy.ext.asyncio import AsyncSession as SQLAlchemyAsyncSession

from src.repository.database import async_db
from src.repository.seed_admin import sync_admin_emails
from src.repository.seed_rbac import seed_rbac_data
from src.repository.table import Base


@event.listens_for(target=async_db.async_engine.sync_engine, identifier="connect")
def inspect_db_server_on_connection(
    db_api_connection: AsyncAdapt_asyncpg_connection, connection_record: _ConnectionRecord
) -> None:
    loguru.logger.info(f"New DB API Connection ---\n {db_api_connection}")
    loguru.logger.info(f"Connection Record ---\n {connection_record}")


@event.listens_for(target=async_db.async_engine.sync_engine, identifier="close")
def inspect_db_server_on_close(
    db_api_connection: AsyncAdapt_asyncpg_connection, connection_record: _ConnectionRecord
) -> None:
    loguru.logger.info(f"Closing DB API Connection ---\n {db_api_connection}")
    loguru.logger.info(f"Closed Connection Record ---\n {connection_record}")


async def initialize_db_tables(connection: AsyncConnection) -> None:
    loguru.logger.info("Database Table Creation --- Initializing . . .")

    db_init_mode = os.getenv("DB_INIT_MODE", "create").strip().lower()

    # MSSQL specific way to create schema if it doesn't exist
    await connection.execute(sqlalchemy.text("""
        IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'app')
        BEGIN
            EXEC('CREATE SCHEMA [app]');
        END
    """))

    if db_init_mode == "reset":
        loguru.logger.warning("Database Table Creation --- Reset mode enabled. Dropping all tables.")
        await connection.run_sync(Base.metadata.drop_all)

    await connection.run_sync(Base.metadata.create_all)

    # `create_all` only creates missing tables — it never ALTERs an existing one, and
    # `account` has existed since the very first migration. Add columns introduced
    # after that point (like `is_admin`) explicitly, guarded so it's a no-op once the
    # column exists (whether create_all just made the table fresh, or it's an older
    # table getting the column added for the first time).
    await connection.execute(sqlalchemy.text("""
        IF NOT EXISTS (
            SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('app.account') AND name = 'is_admin'
        )
        BEGIN
            ALTER TABLE app.account ADD is_admin BIT NOT NULL CONSTRAINT DF_account_is_admin DEFAULT 0;
        END
    """))

    await connection.execute(sqlalchemy.text("""
        IF NOT EXISTS (
            SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('app.project') AND name = 'pic'
        )
        BEGIN
            ALTER TABLE app.project ADD pic NVARCHAR(150) NULL;
        END
    """))

    async with SQLAlchemyAsyncSession(bind=connection, expire_on_commit=False) as async_session:
        await seed_rbac_data(async_session=async_session)
        await sync_admin_emails(async_session=async_session)

    loguru.logger.info("Database Table Creation --- Successfully Initialized!")


async def initialize_db_connection(backend_app: fastapi.FastAPI) -> None:
    loguru.logger.info("Database Connection --- Establishing . . .")

    backend_app.state.db = async_db

    async with backend_app.state.db.async_engine.begin() as connection:
        await initialize_db_tables(connection=connection)

    loguru.logger.info("Database Connection --- Successfully Established!")


async def dispose_db_connection(backend_app: fastapi.FastAPI) -> None:
    loguru.logger.info("Database Connection --- Disposing . . .")

    await backend_app.state.db.async_engine.dispose()

    loguru.logger.info("Database Connection --- Successfully Disposed!")
