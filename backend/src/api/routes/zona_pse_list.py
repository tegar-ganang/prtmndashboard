import fastapi

from src.api.dependencies.authentication import get_current_account
from src.api.dependencies.repository import get_repository
from src.models.db.account import Account
from src.models.schemas.psaims import (
    ZonaPseListBatchCreate,
    ZonaPseListResponse,
    ZonaPseListHistoryResponse,
)
from src.models.schemas.response import APIResponse
from src.repository.crud.zona_pse_list import ZonaPseListCRUDRepository

router = fastapi.APIRouter(
    prefix="/zona-pse-list",
    tags=["zona-pse-list"],
    dependencies=[fastapi.Depends(get_current_account)],
)


@router.get(
    path="/check-period",
    name="zona-pse-list:check-period",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def check_period(
    year: int,
    month: int,
    zona: str | None = None,
    repo: ZonaPseListCRUDRepository = fastapi.Depends(get_repository(repo_type=ZonaPseListCRUDRepository)),
) -> APIResponse:
    exists = await repo.check_period_exists(year, month, zona)
    return APIResponse(success=True, data={"exists": exists}, message="Period check successful", err=None)


@router.post(
    path="/batch",
    name="zona-pse-list:batch-create",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_201_CREATED,
)
async def create_batch(
    batch_data: ZonaPseListBatchCreate,
    current_account: Account = fastapi.Depends(get_current_account),
    repo: ZonaPseListCRUDRepository = fastapi.Depends(get_repository(repo_type=ZonaPseListCRUDRepository)),
) -> APIResponse:
    try:
        upload_batch_id = await repo.create_batch(
            batch_data=batch_data, owner_account_id=str(current_account.id)
        )
    except Exception as e:
        raise fastapi.HTTPException(status_code=400, detail=str(e))
    return APIResponse(
        success=True,
        message=f"Batch successfully uploaded with batch ID: {upload_batch_id}",
        data={"upload_batch_id": upload_batch_id},
        err=None,
    )


@router.get(
    path="/history",
    name="zona-pse-list:history",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def get_history(
    repo: ZonaPseListCRUDRepository = fastapi.Depends(get_repository(repo_type=ZonaPseListCRUDRepository)),
) -> APIResponse:
    history = await repo.get_upload_history()
    return APIResponse(
        success=True,
        message="Zona PSE List upload history fetched successfully",
        data=[ZonaPseListHistoryResponse(**row) for row in history],
        err=None,
    )


@router.get(
    path="",
    name="zona-pse-list:get-all",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def get_data(
    batch_id: str | None = None,
    year: int | None = None,
    month: int | None = None,
    zona: str | None = None,
    repo: ZonaPseListCRUDRepository = fastapi.Depends(get_repository(repo_type=ZonaPseListCRUDRepository)),
) -> APIResponse:
    data = await repo.get_data(batch_id=batch_id, year=year, month=month, field=zona)
    return APIResponse(
        success=True,
        message="Zona PSE List data fetched successfully",
        data=[ZonaPseListResponse.from_orm(row) for row in data],
        err=None,
    )
