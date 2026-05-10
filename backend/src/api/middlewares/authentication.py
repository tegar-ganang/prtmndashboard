import fastapi
import fastapi.responses as fastapi_responses
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from src.config.manager import settings
from src.models.db.account import Account
from src.repository.crud.account import AccountCRUDRepository
from src.repository.database import async_db
from src.securities.authorizations.jwt import jwt_generator
from src.utilities.exceptions.database import EntityDoesNotExist


class JWTAuthenticationMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: fastapi.FastAPI):
        super().__init__(app)
        self.protected_paths = (
            f"{settings.API_PREFIX}/accounts",
            f"{settings.API_PREFIX}/projects",
            f"{settings.API_PREFIX}/auth/me",
            f"{settings.API_PREFIX}/mit",
        )

    def _is_protected_path(self, path: str) -> bool:
        return path.startswith(self.protected_paths)

    async def dispatch(self, request: Request, call_next) -> Response:
        if not self._is_protected_path(request.url.path):
            return await call_next(request)

        authorization = request.headers.get("Authorization")
        if not authorization:
            return fastapi_responses.JSONResponse(
                status_code=fastapi.status.HTTP_401_UNAUTHORIZED,
                content={"success": False, "message": "Unauthorized", "data": None, "err": "Missing JWT token"},
            )

        prefix = f"{settings.JWT_TOKEN_PREFIX} "
        if not authorization.startswith(prefix):
            return fastapi_responses.JSONResponse(
                status_code=fastapi.status.HTTP_401_UNAUTHORIZED,
                content={"success": False, "message": "Unauthorized", "data": None, "err": "Invalid token prefix"},
            )

        token = authorization.removeprefix(prefix).strip()
        account_repo = AccountCRUDRepository(async_session=async_db.async_session)

        try:
            details = jwt_generator.retrieve_details_from_token(token=token, secret_key=settings.JWT_SECRET_KEY)
            email = details[1]
            current_account: Account = await account_repo.read_account_by_email(email=email)

        except (ValueError, EntityDoesNotExist):
            return fastapi_responses.JSONResponse(
                status_code=fastapi.status.HTTP_401_UNAUTHORIZED,
                content={"success": False, "message": "Unauthorized", "data": None, "err": "Invalid JWT token"},
            )

        request.state.current_account = current_account
        request.state.current_account_token = token
        return await call_next(request)
