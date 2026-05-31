import fastapi

from src.api.dependencies.authentication import get_current_account
from src.api.dependencies.repository import get_repository
from src.models.db.account import Account
from src.models.schemas.produksi import ProduksiHistoryResponse, ProduksiResponse, ProduksiTargetResponse
from src.models.schemas.response import APIResponse
from src.repository.crud.produksi import ProduksiCRUDRepository

router = fastapi.APIRouter(prefix="/produksi", tags=["produksi"], dependencies=[fastapi.Depends(get_current_account)])

@router.get(
    path="/check-period",
    name="produksi:check-period",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def check_period(
    year: int,
    month: int,
    field: str | None = None,
    repo: ProduksiCRUDRepository = fastapi.Depends(get_repository(repo_type=ProduksiCRUDRepository)),
) -> APIResponse:
    exists = await repo.check_period_exists(year, month, field)
    return APIResponse(
        success=True,
        data={"exists": exists},
        message="Period check successful",
        err=None,
    )

@router.post(
    path="/upload-excel",
    name="produksi:upload-excel",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_201_CREATED,
)
async def upload_excel(
    file: fastapi.UploadFile,
    reporting_year: int = fastapi.Form(...),
    reporting_month: int = fastapi.Form(...),
    field: str = fastapi.Form(None),
    mode: str = fastapi.Form("append"),
    current_account: Account = fastapi.Depends(get_current_account),
    repo: ProduksiCRUDRepository = fastapi.Depends(get_repository(repo_type=ProduksiCRUDRepository)),
) -> APIResponse:
    try:
        content = await file.read()
        upload_batch_id = await repo.process_excel_and_save(
            file_content=content,
            owner_account_id=str(current_account.id),
            reporting_year=reporting_year,
            reporting_month=reporting_month,
            field=field,
            mode=mode,
        )
    except Exception as e:
        print(f"Error bulk inserting Produksi: {str(e)}", flush=True)
        import traceback
        traceback.print_exc()
        raise fastapi.HTTPException(status_code=400, detail=f"Gagal memproses file Excel: {str(e)}")

    return APIResponse(
        success=True,
        message=f"Batch successfully uploaded with batch ID: {upload_batch_id}",
        data={"upload_batch_id": upload_batch_id},
        err=None,
    )

@router.get(
    path="/history",
    name="produksi:history",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def get_history(
    repo: ProduksiCRUDRepository = fastapi.Depends(get_repository(repo_type=ProduksiCRUDRepository)),
) -> APIResponse:
    history = await repo.get_upload_history()
    return APIResponse(
        success=True,
        message="Upload history fetched successfully",
        data=[ProduksiHistoryResponse(**row) for row in history],
        err=None,
    )

@router.get(
    path="/targets",
    name="produksi:get-targets",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def get_targets(
    year: int | None = None,
    month: int | None = None,
    field: str | None = None,
    repo: ProduksiCRUDRepository = fastapi.Depends(get_repository(repo_type=ProduksiCRUDRepository)),
) -> APIResponse:
    """Endpoint khusus untuk mengambil data target bulanan dari tabel produksi_target."""
    data = await repo.get_targets(year=year, month=month, field=field)
    return APIResponse(
        success=True,
        message="Target data fetched successfully",
        data=[ProduksiTargetResponse.from_orm(row) for row in data],
        err=None,
    )

@router.get(
    path="",
    name="produksi:get-all",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def get_data(
    batch_id: str | None = None,
    year: int | None = None,
    month: int | None = None,
    field: str | None = None,
    repo: ProduksiCRUDRepository = fastapi.Depends(get_repository(repo_type=ProduksiCRUDRepository)),
) -> APIResponse:
    """Endpoint untuk mengambil data realisasi harian. Field `target` berisi data target bulanan (nested)."""
    data = await repo.get_data(batch_id=batch_id, year=year, month=month, field=field)
    return APIResponse(
        success=True,
        message="Data fetched successfully",
        data=[ProduksiResponse.from_orm(row) for row in data],
        err=None,
    )
