import fastapi

from src.api.dependencies.authentication import get_current_account
from src.api.dependencies.repository import get_repository
from src.models.db.account import Account
from src.models.schemas.hazid import DocumentMonthlyBatchCreate, HazidHistoryResponse, HazidResponse
from src.models.schemas.response import APIResponse
from src.repository.crud.hazid import HazidCRUDRepository

router = fastapi.APIRouter(prefix="/hazid", tags=["hazid"], dependencies=[fastapi.Depends(get_current_account)])

@router.get(
    path="/check-period",
    name="hazid:check-period",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def check_period(
    year: int,
    month: int,
    field: str | None = None,
    repo: HazidCRUDRepository = fastapi.Depends(get_repository(repo_type=HazidCRUDRepository)),
) -> APIResponse:
    exists = await repo.check_period_exists(year, month, field)
    return APIResponse(
        success=True,
        data={"exists": exists},
        message="Period check successful",
        err=None,
    )

@router.post(
    path="/batch",
    name="hazid:batch-create",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_201_CREATED,
)
async def create_batch(
    batch_data: DocumentMonthlyBatchCreate,
    current_account: Account = fastapi.Depends(get_current_account),
    repo: HazidCRUDRepository = fastapi.Depends(get_repository(repo_type=HazidCRUDRepository)),
) -> APIResponse:
    try:
        upload_batch_id = await repo.create_batch(
            batch_data=batch_data, owner_account_id=str(current_account.id)
        )
    except Exception as e:
        print(f"Error bulk inserting HAZID: {str(e)}")
        raise fastapi.HTTPException(status_code=400, detail="Gagal menyimpan data ke database. Silakan pastikan format template sudah benar atau hubungi administrator.")

    return APIResponse(
        success=True,
        message=f"Batch successfully uploaded with batch ID: {upload_batch_id}",
        data={"upload_batch_id": upload_batch_id},
        err=None,
    )

@router.get(
    path="/history",
    name="hazid:history",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def get_history(
    repo: HazidCRUDRepository = fastapi.Depends(get_repository(repo_type=HazidCRUDRepository)),
) -> APIResponse:
    history = await repo.get_upload_history()
    return APIResponse(
        success=True,
        message="Upload history fetched successfully",
        data=[HazidHistoryResponse(**row) for row in history],
        err=None,
    )

@router.get(
    path="",
    name="hazid:get-all",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def get_data(
    batch_id: str | None = None,
    year: int | None = None,
    month: int | None = None,
    field: str | None = None,
    repo: HazidCRUDRepository = fastapi.Depends(get_repository(repo_type=HazidCRUDRepository)),
) -> APIResponse:
    data = await repo.get_data(batch_id=batch_id, year=year, period=month, field=field)
    return APIResponse(
        success=True,
        message="Data fetched successfully",
        data=[HazidResponse.from_orm(row) for row in data],
        err=None,
    )
