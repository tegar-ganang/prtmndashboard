import fastapi

from src.api.dependencies.authentication import get_current_account
from src.api.dependencies.repository import get_repository
from src.models.db.account import Account
from src.models.schemas.lopa import DocumentMonthlyBatchCreate, LopaHistoryResponse, LopaResponse
from src.models.schemas.response import APIResponse
from src.repository.crud.lopa import LopaCRUDRepository

router = fastapi.APIRouter(prefix="/lopa", tags=["lopa"], dependencies=[fastapi.Depends(get_current_account)])

@router.get(
    path="/check-period",
    name="lopa:check-period",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def check_period(
    year: int,
    month: int,
    repo: LopaCRUDRepository = fastapi.Depends(get_repository(repo_type=LopaCRUDRepository)),
) -> APIResponse:
    exists = await repo.check_period_exists(year, month)
    return APIResponse(
        success=True,
        data={"exists": exists},
        message="Period check successful",
        err=None,
    )

@router.post(
    path="/batch",
    name="lopa:batch-create",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_201_CREATED,
)
async def create_batch(
    batch_data: DocumentMonthlyBatchCreate,
    current_account: Account = fastapi.Depends(get_current_account),
    repo: LopaCRUDRepository = fastapi.Depends(get_repository(repo_type=LopaCRUDRepository)),
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
    name="lopa:history",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def get_history(
    repo: LopaCRUDRepository = fastapi.Depends(get_repository(repo_type=LopaCRUDRepository)),
) -> APIResponse:
    history = await repo.get_upload_history()
    return APIResponse(
        success=True,
        message="Upload history fetched successfully",
        data=[LopaHistoryResponse(**row) for row in history],
        err=None,
    )

@router.get(
    path="",
    name="lopa:get-all",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def get_data(
    batch_id: str | None = None,
    year: int | None = None,
    month: int | None = None,
    repo: LopaCRUDRepository = fastapi.Depends(get_repository(repo_type=LopaCRUDRepository)),
) -> APIResponse:
    data = await repo.get_data(batch_id=batch_id, year=year, month=month)
    return APIResponse(
        success=True,
        message="Data fetched successfully",
        data=[LopaResponse.from_orm(row) for row in data],
        err=None,
    )
