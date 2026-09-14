import fastapi

from src.api.dependencies.authentication import get_current_account
from src.api.dependencies.rbac import require_menu_access
from src.api.dependencies.repository import get_repository
from src.models.db.account import Account
from src.models.schemas.abo import ABOHistoryResponse, ABOResponse, DocumentMonthlyBatchCreate
from src.models.schemas.response import APIResponse
from src.repository.crud.abo import ABOCRUDRepository

router = fastapi.APIRouter(prefix="/abo", tags=["abo"], dependencies=[fastapi.Depends(require_menu_access("abo"))])


@router.get(
    path="/check-period",
    name="abo:check-period",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def check_period(
    year: int,
    month: int,
    field: str | None = None,
    repo: ABOCRUDRepository = fastapi.Depends(get_repository(repo_type=ABOCRUDRepository)),
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
    name="abo:batch-create",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_201_CREATED,
    dependencies=[fastapi.Depends(require_menu_access("abo", require_upload=True))],
)
async def create_batch(
    batch_data: DocumentMonthlyBatchCreate,
    current_account: Account = fastapi.Depends(get_current_account),
    repo: ABOCRUDRepository = fastapi.Depends(get_repository(repo_type=ABOCRUDRepository)),
) -> APIResponse:
    try:
        upload_batch_id = await repo.create_batch(
            batch_data=batch_data, owner_account_id=str(current_account.id)
        )
    except Exception as e:
        print(f"Error bulk inserting ABO: {str(e)}", flush=True)
        import traceback
        traceback.print_exc()
        raise fastapi.HTTPException(
            status_code=400,
            detail="Gagal menyimpan data ABO ke database. Silakan pastikan format template sudah benar atau hubungi administrator."
        )

    return APIResponse(
        success=True,
        message=f"Batch successfully uploaded with batch ID: {upload_batch_id}",
        data={"upload_batch_id": upload_batch_id},
        err=None,
    )


@router.get(
    path="/history",
    name="abo:history",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def get_history(
    repo: ABOCRUDRepository = fastapi.Depends(get_repository(repo_type=ABOCRUDRepository)),
) -> APIResponse:
    history = await repo.get_upload_history()
    return APIResponse(
        success=True,
        message="ABO upload history fetched successfully",
        data=[ABOHistoryResponse(**row) for row in history],
        err=None,
    )


@router.get(
    path="",
    name="abo:get-all",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def get_data(
    batch_id: str | None = None,
    year: int | None = None,
    month: int | None = None,
    field: str | None = None,
    repo: ABOCRUDRepository = fastapi.Depends(get_repository(repo_type=ABOCRUDRepository)),
) -> APIResponse:
    data = await repo.get_data(batch_id=batch_id, year=year, month=month, field=field)
    return APIResponse(
        success=True,
        message="ABO data fetched successfully",
        data=[ABOResponse.from_orm(row) for row in data],
        err=None,
    )
