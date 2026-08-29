import sqlalchemy
from sqlalchemy.ext.asyncio import AsyncSession as SQLAlchemyAsyncSession

from src.config.manager import settings
from src.models.db.account import Account


async def sync_admin_emails(async_session: SQLAlchemyAsyncSession) -> None:
    """Promote accounts whose email is in ADMIN_EMAILS to is_admin=True.

    Runs on every startup so bootstrapping/rotating admins is just an env var
    change — no manual DB surgery needed. Does not commit — caller owns the
    transaction (see events.py).
    """
    if not settings.ADMIN_EMAILS:
        return

    await async_session.execute(
        sqlalchemy.update(Account)
        .where(sqlalchemy.func.lower(Account.email).in_(settings.ADMIN_EMAILS))
        .values(is_admin=True)
    )
    await async_session.flush()
