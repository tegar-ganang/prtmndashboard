import fastapi
import pydantic

from src.api.dependencies.authentication import get_current_account
from src.api.dependencies.repository import get_repository
from src.models.schemas.account import AccountInResponse, AccountInUpdate, AccountWithToken
from src.models.schemas.response import APIResponse
from src.repository.crud.account import AccountCRUDRepository
from src.securities.authorizations.jwt import jwt_generator
from src.utilities.exceptions.database import EntityDoesNotExist
from src.utilities.exceptions.http.exc_404 import http_404_exc_id_not_found_request

router = fastapi.APIRouter(prefix="/accounts", tags=["accounts"], dependencies=[fastapi.Depends(get_current_account)])


@router.get(
    path="",
    name="accountss:read-accounts",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def get_accounts(
    account_repo: AccountCRUDRepository = fastapi.Depends(get_repository(repo_type=AccountCRUDRepository)),
) -> APIResponse:
    db_accounts = await account_repo.read_accounts()
    db_account_list: list = list()

    for db_account in db_accounts:
        access_token = jwt_generator.generate_access_token(account=db_account)
        account = AccountInResponse(
            id=str(db_account.id),
            authorized_account=AccountWithToken(
                token=access_token,
                name=db_account.name,
                email=db_account.email,  # type: ignore
                is_verified=db_account.is_verified,
                is_active=db_account.is_active,
                is_logged_in=db_account.is_logged_in,
                created_at=db_account.created_at,
                updated_at=db_account.updated_at,
            ),
        )
        db_account_list.append(account)

    return APIResponse(success=True, message="Accounts fetched successfully", data=db_account_list, err=None)


@router.get(
    path="/{id}",
    name="accountss:read-account-by-id",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def get_account(
    id: str,
    account_repo: AccountCRUDRepository = fastapi.Depends(get_repository(repo_type=AccountCRUDRepository)),
) -> APIResponse:
    try:
        db_account = await account_repo.read_account_by_id(id=id)
        access_token = jwt_generator.generate_access_token(account=db_account)

    except EntityDoesNotExist:
        raise await http_404_exc_id_not_found_request(id=id)

    return APIResponse(
        success=True,
        message="Account fetched successfully",
        data=AccountInResponse(
            id=str(db_account.id),
            authorized_account=AccountWithToken(
                token=access_token,
                name=db_account.name,
                email=db_account.email,  # type: ignore
                is_verified=db_account.is_verified,
                is_active=db_account.is_active,
                is_logged_in=db_account.is_logged_in,
                created_at=db_account.created_at,
                updated_at=db_account.updated_at,
            ),
        ),
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
    update_password: str | None = None,
    account_repo: AccountCRUDRepository = fastapi.Depends(get_repository(repo_type=AccountCRUDRepository)),
) -> APIResponse:
    account_update = AccountInUpdate(name=update_name, email=update_email, password=update_password)
    try:
        updated_db_account = await account_repo.update_account_by_id(id=id, account_update=account_update)

    except EntityDoesNotExist:
        raise await http_404_exc_id_not_found_request(id=id)

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
    id: str, account_repo: AccountCRUDRepository = fastapi.Depends(get_repository(repo_type=AccountCRUDRepository))
) -> APIResponse:
    try:
        deletion_result = await account_repo.delete_account_by_id(id=id)

    except EntityDoesNotExist:
        raise await http_404_exc_id_not_found_request(id=id)

    return APIResponse(success=True, message=deletion_result, data={"id": id}, err=None)
