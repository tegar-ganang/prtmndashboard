import fastapi

from src.api.dependencies.authentication import get_current_account
from src.api.dependencies.rbac import require_menu_access
from src.api.dependencies.repository import get_repository
from src.models.db.account import Account
from src.models.schemas.airms import DocumentMonthlyBatchCreate
from src.models.schemas.lcv import LCVProjectCharterBudayaResponse, LCVMonitoringResponse, LCVHistoryResponse
from src.models.schemas.response import APIResponse
from src.repository.crud.lcv import LCVProjectCharterBudayaCRUDRepository, LCVMonitoringCRUDRepository

router = fastapi.APIRouter(prefix="/lcv", tags=["lcv"], dependencies=[fastapi.Depends(require_menu_access("lcv"))])


@router.get(
    path="/check-period",
    name="lcv:check-period",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def check_period(
    doc_type: str,
    year: int,
    month: int = 1,
    field: str | None = None,
    charter_repo: LCVProjectCharterBudayaCRUDRepository = fastapi.Depends(get_repository(repo_type=LCVProjectCharterBudayaCRUDRepository)),
    monitoring_repo: LCVMonitoringCRUDRepository = fastapi.Depends(get_repository(repo_type=LCVMonitoringCRUDRepository)),
) -> APIResponse:
    if doc_type == "LCV_PROJECT_CHARTER_BUDAYA":
        exists = await charter_repo.check_period_exists(year, month, field)
    else:
        exists = await monitoring_repo.check_period_exists(year, month, field)

    return APIResponse(
        success=True,
        data={"exists": exists},
        message="Period check successful",
        err=None,
    )


@router.post(
    path="/batch",
    name="lcv:batch-create",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_201_CREATED,
    dependencies=[fastapi.Depends(require_menu_access("lcv", require_upload=True))],
)
async def create_batch(
    batch_data: DocumentMonthlyBatchCreate,
    current_account: Account = fastapi.Depends(get_current_account),
    charter_repo: LCVProjectCharterBudayaCRUDRepository = fastapi.Depends(get_repository(repo_type=LCVProjectCharterBudayaCRUDRepository)),
    monitoring_repo: LCVMonitoringCRUDRepository = fastapi.Depends(get_repository(repo_type=LCVMonitoringCRUDRepository)),
) -> APIResponse:
    try:
        if batch_data.doc_type == "LCV_PROJECT_CHARTER_BUDAYA":
            upload_batch_id = await charter_repo.create_batch(
                batch_data=batch_data, owner_account_id=str(current_account.id)
            )
        else:
            upload_batch_id = await monitoring_repo.create_batch(
                batch_data=batch_data, owner_account_id=str(current_account.id)
            )
    except Exception as e:
        print(f"Error bulk inserting LCV ({batch_data.doc_type}): {str(e)}", flush=True)
        import traceback
        traceback.print_exc()
        raise fastapi.HTTPException(
            status_code=400,
            detail="Gagal menyimpan data LCV ke database. Silakan pastikan format template sudah benar atau hubungi administrator."
        )

    return APIResponse(
        success=True,
        message=f"Batch successfully uploaded with batch ID: {upload_batch_id}",
        data={"upload_batch_id": upload_batch_id},
        err=None,
    )


@router.get(
    path="/history",
    name="lcv:history",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def get_history(
    doc_type: str,
    charter_repo: LCVProjectCharterBudayaCRUDRepository = fastapi.Depends(get_repository(repo_type=LCVProjectCharterBudayaCRUDRepository)),
    monitoring_repo: LCVMonitoringCRUDRepository = fastapi.Depends(get_repository(repo_type=LCVMonitoringCRUDRepository)),
) -> APIResponse:
    if doc_type == "LCV_PROJECT_CHARTER_BUDAYA":
        history = await charter_repo.get_upload_history()
    else:
        history = await monitoring_repo.get_upload_history()

    return APIResponse(
        success=True,
        message="LCV upload history fetched successfully",
        data=[LCVHistoryResponse(**row) for row in history],
        err=None,
    )


@router.get(
    path="",
    name="lcv:get-all",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def get_data(
    doc_type: str,
    batch_id: str | None = None,
    year: int | None = None,
    month: int | None = None,
    field: str | None = None,
    charter_repo: LCVProjectCharterBudayaCRUDRepository = fastapi.Depends(get_repository(repo_type=LCVProjectCharterBudayaCRUDRepository)),
    monitoring_repo: LCVMonitoringCRUDRepository = fastapi.Depends(get_repository(repo_type=LCVMonitoringCRUDRepository)),
) -> APIResponse:
    if doc_type == "LCV_PROJECT_CHARTER_BUDAYA":
        data = await charter_repo.get_data(batch_id=batch_id, year=year, month=month, field=field)
        res_data = [LCVProjectCharterBudayaResponse.from_orm(row) for row in data]
    else:
        data = await monitoring_repo.get_data(batch_id=batch_id, year=year, month=month, field=field)
        res_data = [LCVMonitoringResponse.from_orm(row) for row in data]

    return APIResponse(
        success=True,
        message="LCV data fetched successfully",
        data=res_data,
        err=None,
    )
