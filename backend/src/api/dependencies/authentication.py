import fastapi
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from src.models.db.account import Account


bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_account(
    request: fastapi.Request,
    credentials: HTTPAuthorizationCredentials | None = fastapi.Security(bearer_scheme),
) -> Account:
    if credentials is None:
        raise fastapi.HTTPException(status_code=fastapi.status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    current_account = getattr(request.state, "current_account", None)

    if not current_account:
        raise fastapi.HTTPException(status_code=fastapi.status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    return current_account
