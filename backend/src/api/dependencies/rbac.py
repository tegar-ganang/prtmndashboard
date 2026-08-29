import typing

import fastapi
import sqlalchemy
from sqlalchemy.ext.asyncio import AsyncSession as SQLAlchemyAsyncSession

from src.api.dependencies.authentication import get_current_account
from src.api.dependencies.session import get_async_session
from src.models.db.account import Account
from src.models.db.menu import Menu
from src.models.db.role_menu_access import RoleMenuAccess


def require_menu_access(menu_name: str, require_upload: bool = False) -> typing.Callable:
    async def _check(
        current_account: Account = fastapi.Depends(get_current_account),
        async_session: SQLAlchemyAsyncSession = fastapi.Depends(get_async_session),
    ) -> Account:
        if current_account.role_id is None:
            raise fastapi.HTTPException(status_code=fastapi.status.HTTP_403_FORBIDDEN, detail="Account has no role assigned")

        stmt = (
            sqlalchemy.select(RoleMenuAccess)
            .join(Menu, Menu.id == RoleMenuAccess.menu_id)
            .where(RoleMenuAccess.role_id == current_account.role_id, Menu.menu_name == menu_name)
        )
        access = (await async_session.execute(stmt)).scalar()

        if not access or not access.can_view:
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_account.role_name}' does not have access to '{menu_name}'",
            )

        if require_upload and not access.can_upload:
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_account.role_name}' does not have upload permission for '{menu_name}'",
            )

        return current_account

    return _check


async def require_admin(current_account: Account = fastapi.Depends(get_current_account)) -> Account:
    if not current_account.is_admin:
        raise fastapi.HTTPException(status_code=fastapi.status.HTTP_403_FORBIDDEN, detail="Admin privileges required")

    return current_account
