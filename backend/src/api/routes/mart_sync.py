import fastapi

from src.api.dependencies.rbac import require_admin
from src.api.dependencies.repository import get_repository
from src.models.schemas.mart_sync import MartSyncCountRow, MartSyncRunResult
from src.models.schemas.response import APIResponse
from src.repository.crud.mart_sync import MartSyncCRUDRepository

router = fastapi.APIRouter(
    prefix="/admin/mart-sync", tags=["mart-sync"], dependencies=[fastapi.Depends(require_admin)]
)


@router.get(
    path="/counts",
    name="mart-sync:get-counts",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def get_counts(
    repo: MartSyncCRUDRepository = fastapi.Depends(get_repository(repo_type=MartSyncCRUDRepository)),
) -> APIResponse:
    rows = await repo.get_table_counts()
    return APIResponse(
        success=True,
        message="Table counts fetched successfully",
        data=[MartSyncCountRow(**row) for row in rows],
        err=None,
    )


@router.post(
    path="/run",
    name="mart-sync:run",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def run_sync(
    repo: MartSyncCRUDRepository = fastapi.Depends(get_repository(repo_type=MartSyncCRUDRepository)),
) -> APIResponse:
    results = await repo.run_sync()
    all_success = all(r["success"] for r in results)
    return APIResponse(
        success=all_success,
        message="Sync completed successfully" if all_success else "Sync completed with errors",
        data=[MartSyncRunResult(**r) for r in results],
        err=None,
    )
