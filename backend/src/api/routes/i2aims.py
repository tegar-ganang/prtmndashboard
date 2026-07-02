import fastapi

from src.api.dependencies.authentication import get_current_account
from src.api.dependencies.repository import get_repository
from src.models.db.account import Account
from src.models.schemas.i2aims import DocumentMonthlyBatchCreate, I2AIMSHistoryResponse, I2AIMSResponse
from src.models.schemas.response import APIResponse
from src.repository.crud.i2aims import I2AIMSCRUDRepository

router = fastapi.APIRouter(prefix="/i2aims", tags=["i2aims"], dependencies=[fastapi.Depends(get_current_account)])


@router.get(
    path="/check-period",
    name="i2aims:check-period",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def check_period(
    year: int,
    month: int,
    field: str | None = None,
    repo: I2AIMSCRUDRepository = fastapi.Depends(get_repository(repo_type=I2AIMSCRUDRepository)),
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
    name="i2aims:batch-create",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_201_CREATED,
)
async def create_batch(
    batch_data: DocumentMonthlyBatchCreate,
    current_account: Account = fastapi.Depends(get_current_account),
    repo: I2AIMSCRUDRepository = fastapi.Depends(get_repository(repo_type=I2AIMSCRUDRepository)),
) -> APIResponse:
    try:
        upload_batch_id = await repo.create_batch(
            batch_data=batch_data, owner_account_id=str(current_account.id)
        )
    except Exception as e:
        print(f"Error bulk inserting I2AIMS: {str(e)}", flush=True)
        import traceback
        traceback.print_exc()
        raise fastapi.HTTPException(
            status_code=400,
            detail="Gagal menyimpan data I2AIMS ke database. Silakan pastikan format template sudah benar atau hubungi administrator."
        )

    return APIResponse(
        success=True,
        message=f"Batch successfully uploaded with batch ID: {upload_batch_id}",
        data={"upload_batch_id": upload_batch_id},
        err=None,
    )


@router.get(
    path="/history",
    name="i2aims:history",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def get_history(
    repo: I2AIMSCRUDRepository = fastapi.Depends(get_repository(repo_type=I2AIMSCRUDRepository)),
) -> APIResponse:
    history = await repo.get_upload_history()
    return APIResponse(
        success=True,
        message="I2AIMS upload history fetched successfully",
        data=[I2AIMSHistoryResponse(**row) for row in history],
        err=None,
    )


@router.get(
    path="",
    name="i2aims:get-all",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def get_data(
    batch_id: str | None = None,
    year: int | None = None,
    month: int | None = None,
    field: str | None = None,
    repo: I2AIMSCRUDRepository = fastapi.Depends(get_repository(repo_type=I2AIMSCRUDRepository)),
) -> APIResponse:
    data = await repo.get_data(batch_id=batch_id, year=year, month=month, field=field)
    return APIResponse(
        success=True,
        message="I2AIMS data fetched successfully",
        data=[I2AIMSResponse.from_orm(row) for row in data],
        err=None,
    )
