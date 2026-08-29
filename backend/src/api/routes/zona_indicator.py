import fastapi
import loguru

from src.api.dependencies.authentication import get_current_account
from src.api.dependencies.rbac import require_menu_access
from src.api.dependencies.repository import get_repository
from src.models.db.account import Account
from src.models.schemas.psaims import (
    ZonaIndicatorBatchCreate,
    ZonaIndicatorResponse,
    ZonaIndicatorHistoryResponse,
)
from src.models.schemas.response import APIResponse
from src.repository.crud.zona_indicator import ZonaIndicatorCRUDRepository

router = fastapi.APIRouter(
    prefix="/zona-indicator",
    tags=["zona-indicator"],
    dependencies=[fastapi.Depends(require_menu_access("zona_indicator"))],
)


@router.get(
    path="/check-period",
    name="zona-indicator:check-period",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def check_period(
    year: int,
    zona: str | None = None,
    repo: ZonaIndicatorCRUDRepository = fastapi.Depends(get_repository(repo_type=ZonaIndicatorCRUDRepository)),
) -> APIResponse:
    exists = await repo.check_period_exists(year, 0, zona)
    return APIResponse(success=True, data={"exists": exists}, message="Period check successful", err=None)


@router.post(
    path="/batch",
    name="zona-indicator:batch-create",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_201_CREATED,
    dependencies=[fastapi.Depends(require_menu_access("zona_indicator", require_upload=True))],
)
async def create_batch(
    batch_data: ZonaIndicatorBatchCreate,
    current_account: Account = fastapi.Depends(get_current_account),
    repo: ZonaIndicatorCRUDRepository = fastapi.Depends(get_repository(repo_type=ZonaIndicatorCRUDRepository)),
) -> APIResponse:
    try:
        upload_batch_id = await repo.create_batch(
            batch_data=batch_data, owner_account_id=str(current_account.id)
        )
    except Exception:
        loguru.logger.exception("Failed to create Zona Indicator batch")
        raise fastapi.HTTPException(status_code=400, detail="Gagal menyimpan data ke database.")
    return APIResponse(
        success=True,
        message=f"Batch successfully uploaded with batch ID: {upload_batch_id}",
        data={"upload_batch_id": upload_batch_id},
        err=None,
    )


@router.get(
    path="/history",
    name="zona-indicator:history",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def get_history(
    repo: ZonaIndicatorCRUDRepository = fastapi.Depends(get_repository(repo_type=ZonaIndicatorCRUDRepository)),
) -> APIResponse:
    history = await repo.get_upload_history()
    return APIResponse(
        success=True,
        message="Zona Indicator upload history fetched successfully",
        data=[ZonaIndicatorHistoryResponse(**row) for row in history],
        err=None,
    )


@router.get(
    path="",
    name="zona-indicator:get-all",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def get_data(
    batch_id: str | None = None,
    year: int | None = None,
    zona: str | None = None,
    repo: ZonaIndicatorCRUDRepository = fastapi.Depends(get_repository(repo_type=ZonaIndicatorCRUDRepository)),
) -> APIResponse:
    data = await repo.get_data(batch_id=batch_id, year=year, field=zona)
    return APIResponse(
        success=True,
        message="Zona Indicator data fetched successfully",
        data=[ZonaIndicatorResponse.from_orm(row) for row in data],
        err=None,
    )
