import fastapi
import pydantic
import sqlalchemy
from sqlalchemy.ext.asyncio import AsyncSession as SQLAlchemyAsyncSession

from src.api.dependencies.authentication import get_current_account
from src.api.dependencies.rbac import require_admin
from src.api.dependencies.repository import get_repository
from src.api.dependencies.session import get_async_session
from src.models.db.account import Account
from src.models.db.role import Role
from src.config.manager import settings
from src.models.schemas.account import (
    AccountAdminCreate,
    AccountInResponse,
    AccountInUpdate,
    AccountPublic,
    AccountRoleUpdate,
    AccountStatusUpdate,
    AccountWithToken,
    ChangePasswordRequest,
    RoleOut,
)
from src.models.schemas.response import APIResponse
from src.repository.crud.account import AccountCRUDRepository
from src.securities.authorizations.jwt import jwt_generator
from src.securities.hashing.password import pwd_generator
from src.utilities.exceptions.database import EntityAlreadyExists, EntityDoesNotExist
from src.utilities.exceptions.http.exc_400 import http_exc_400_credentials_bad_signup_request
from src.utilities.exceptions.http.exc_403 import http_403_exc_forbidden_request
from src.utilities.exceptions.http.exc_404 import http_404_exc_id_not_found_request

router = fastapi.APIRouter(prefix="/accounts", tags=["accounts"], dependencies=[fastapi.Depends(get_current_account)])


def _account_to_public(db_account: Account) -> AccountPublic:
    return AccountPublic(
        id=str(db_account.id),
        email=db_account.email,  # type: ignore
        name=db_account.name,
        role_id=db_account.role_id,
        role_name=db_account.role_name,
        is_admin=db_account.is_admin,
        is_verified=db_account.is_verified,
        is_active=db_account.is_active,
        is_logged_in=db_account.is_logged_in,
        created_at=db_account.created_at,
        updated_at=db_account.updated_at,
    )


@router.get(
    path="",
    name="accountss:read-accounts",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def get_accounts(
    current_account: Account = fastapi.Depends(get_current_account),
    account_repo: AccountCRUDRepository = fastapi.Depends(get_repository(repo_type=AccountCRUDRepository)),
) -> APIResponse:
    if current_account.is_admin:
        db_accounts = await account_repo.read_accounts()
        return APIResponse(
            success=True,
            message="Accounts fetched successfully",
            data=[_account_to_public(a) for a in db_accounts],
            err=None,
        )

    # Non-admins can only see their own account.
    return APIResponse(
        success=True,
        message="Accounts fetched successfully",
        data=[_account_to_public(current_account)],
        err=None,
    )


@router.post(
    path="",
    name="accountss:admin-create-account",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_201_CREATED,
    dependencies=[fastapi.Depends(require_admin)],
)
async def create_account_admin(
    account_create: AccountAdminCreate,
    account_repo: AccountCRUDRepository = fastapi.Depends(get_repository(repo_type=AccountCRUDRepository)),
) -> APIResponse:
    try:
        if account_create.name:
            await account_repo.is_name_taken(name=account_create.name)
        await account_repo.is_email_taken(email=account_create.email)

    except EntityAlreadyExists:
        raise await http_exc_400_credentials_bad_signup_request()

    new_account = await account_repo.create_account_as_admin(account_create=account_create)

    return APIResponse(
        success=True,
        message="Account created successfully",
        data=_account_to_public(new_account),
        err=None,
    )


@router.get(
    path="/roles",
    name="accountss:list-roles",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
    dependencies=[fastapi.Depends(require_admin)],
)
async def list_roles(
    async_session: SQLAlchemyAsyncSession = fastapi.Depends(get_async_session),
) -> APIResponse:
    roles = (await async_session.execute(sqlalchemy.select(Role))).scalars().all()
    return APIResponse(
        success=True,
        message="Roles fetched successfully",
        data=[RoleOut(id=r.id, role_name=r.role_name) for r in roles],
        err=None,
    )


@router.patch(
    path="/{id}/status",
    name="accountss:update-account-status",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
    dependencies=[fastapi.Depends(require_admin)],
)
async def update_account_status(
    id: str,
    payload: AccountStatusUpdate,
    current_account: Account = fastapi.Depends(get_current_account),
    account_repo: AccountCRUDRepository = fastapi.Depends(get_repository(repo_type=AccountCRUDRepository)),
) -> APIResponse:
    if id == str(current_account.id) and not payload.is_active:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="Tidak bisa menonaktifkan akun sendiri",
        )

    try:
        updated_db_account = await account_repo.update_account_status_by_id(id=id, is_active=payload.is_active)

    except EntityDoesNotExist:
        raise await http_404_exc_id_not_found_request(id=id)

    return APIResponse(
        success=True,
        message="Account status updated successfully",
        data=_account_to_public(updated_db_account),
        err=None,
    )


@router.patch(
    path="/{id}/role",
    name="accountss:update-account-role",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
    dependencies=[fastapi.Depends(require_admin)],
)
async def update_account_role(
    id: str,
    payload: AccountRoleUpdate,
    account_repo: AccountCRUDRepository = fastapi.Depends(get_repository(repo_type=AccountCRUDRepository)),
) -> APIResponse:
    try:
        updated_db_account = await account_repo.update_account_role_by_id(id=id, role_id=payload.role_id)

    except EntityDoesNotExist:
        raise await http_404_exc_id_not_found_request(id=id)

    return APIResponse(
        success=True,
        message="Account role updated successfully",
        data=_account_to_public(updated_db_account),
        err=None,
    )


@router.get(
    path="/default-password-hint",
    name="accountss:default-password-hint",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
    dependencies=[fastapi.Depends(require_admin)],
)
async def get_default_password_hint() -> APIResponse:
    return APIResponse(
        success=True,
        message="Default password fetched successfully",
        data={"default_password": settings.DEFAULT_USER_PASSWORD},
        err=None,
    )


@router.patch(
    path="/me/password",
    name="accountss:change-own-password",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def change_own_password(
    payload: ChangePasswordRequest,
    current_account: Account = fastapi.Depends(get_current_account),
    account_repo: AccountCRUDRepository = fastapi.Depends(get_repository(repo_type=AccountCRUDRepository)),
) -> APIResponse:
    if not pwd_generator.is_password_authenticated(
        hash_salt=current_account.hash_salt,
        password=payload.current_password,
        hashed_password=current_account.hashed_password,
    ):
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="Password saat ini tidak sesuai",
        )

    account_update = AccountInUpdate(name=None, email=None, password=payload.new_password)
    await account_repo.update_account_by_id(id=str(current_account.id), account_update=account_update)

    return APIResponse(success=True, message="Password berhasil diubah", data=None, err=None)


@router.get(
    path="/{id}",
    name="accountss:read-account-by-id",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def get_account(
    id: str,
    current_account: Account = fastapi.Depends(get_current_account),
    account_repo: AccountCRUDRepository = fastapi.Depends(get_repository(repo_type=AccountCRUDRepository)),
) -> APIResponse:
    if id != str(current_account.id):
        raise await http_403_exc_forbidden_request()

    try:
        db_account = await account_repo.read_account_by_id(id=id)

    except EntityDoesNotExist:
        raise await http_404_exc_id_not_found_request(id=id)

    return APIResponse(
        success=True,
        message="Account fetched successfully",
        data=_account_to_public(db_account),
        err=None,
    )


@router.patch(
    path="/{id}",
    name="accountss:update-account-by-id",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def update_account(
    id: str,
    update_name: str | None = None,
    update_email: pydantic.EmailStr | None = None,
    current_account: Account = fastapi.Depends(get_current_account),
    account_repo: AccountCRUDRepository = fastapi.Depends(get_repository(repo_type=AccountCRUDRepository)),
) -> APIResponse:
    # Password changes never go through here — self-service goes through
    # /accounts/me/password (requires proving the current password); nobody,
    # not even an admin, can set another account's password to an arbitrary value.
    is_self = id == str(current_account.id)
    if not is_self and not current_account.is_admin:
        raise await http_403_exc_forbidden_request()

    account_update = AccountInUpdate(name=update_name, email=update_email, password=None)
    try:
        updated_db_account = await account_repo.update_account_by_id(id=id, account_update=account_update)

    except EntityDoesNotExist:
        raise await http_404_exc_id_not_found_request(id=id)

    # Only mint a fresh JWT when the caller edited their own account — an admin editing
    # someone else's account must never receive a token usable to impersonate them.
    if not is_self:
        return APIResponse(
            success=True,
            message="Account updated successfully",
            data=_account_to_public(updated_db_account),
            err=None,
        )

    access_token = jwt_generator.generate_access_token(account=updated_db_account)

    return APIResponse(
        success=True,
        message="Account updated successfully",
        data=AccountInResponse(
            id=str(updated_db_account.id),
            authorized_account=AccountWithToken(
                token=access_token,
                name=updated_db_account.name,
                email=updated_db_account.email,  # type: ignore
                role_name=updated_db_account.role_name,
                is_admin=updated_db_account.is_admin,
                is_verified=updated_db_account.is_verified,
                is_active=updated_db_account.is_active,
                is_logged_in=updated_db_account.is_logged_in,
                created_at=updated_db_account.created_at,
                updated_at=updated_db_account.updated_at,
            ),
        ),
        err=None,
    )


@router.delete(path="", name="accountss:delete-account-by-id", response_model=APIResponse, status_code=fastapi.status.HTTP_200_OK)
async def delete_account(
    id: str,
    current_account: Account = fastapi.Depends(get_current_account),
    account_repo: AccountCRUDRepository = fastapi.Depends(get_repository(repo_type=AccountCRUDRepository)),
) -> APIResponse:
    if id != str(current_account.id) and not current_account.is_admin:
        raise await http_403_exc_forbidden_request()

    try:
        deletion_result = await account_repo.delete_account_by_id(id=id)

    except EntityDoesNotExist:
        raise await http_404_exc_id_not_found_request(id=id)

    return APIResponse(success=True, message=deletion_result, data={"id": id}, err=None)
