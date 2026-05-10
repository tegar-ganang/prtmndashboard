import fastapi

from src.api.dependencies.authentication import get_current_account
from src.api.dependencies.repository import get_repository
from src.models.db.account import Account
from src.models.schemas.mit import DocumentBatchCreate, MitHistoryResponse, MITResponse as MitDataResponse
from src.models.schemas.response import APIResponse
from src.repository.crud.mit import MITCRUDRepository

router = fastapi.APIRouter(prefix="/mit", tags=["mit"], dependencies=[fastapi.Depends(get_current_account)])

@router.get(
    path="/check-period",
    name="mit:check-period",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def check_period(
    year: int,
    quarter: int,
    mit_repo: MITCRUDRepository = fastapi.Depends(get_repository(repo_type=MITCRUDRepository)),
) -> APIResponse:
    exists = await mit_repo.check_period_exists(year, quarter)
    return APIResponse(
        success=True,
        data={"exists": exists},
        message="Period check successful",
        err=None,
    )

@router.post(
    path="/batch",
    name="mit:batch-create",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_201_CREATED,
)
async def create_batch_mit(
    batch_data: DocumentBatchCreate,
    current_account: Account = fastapi.Depends(get_current_account),
    mit_repo: MITCRUDRepository = fastapi.Depends(get_repository(repo_type=MITCRUDRepository)),
) -> APIResponse:
    try:
        upload_batch_id = await mit_repo.create_batch_mit(
            batch_data=batch_data, owner_account_id=str(current_account.id)
        )
    except Exception as e:
        # In a real app, you'd want to handle exceptions better, returning a 400 or 500
        # based on the database exception type.
        raise fastapi.HTTPException(status_code=400, detail=str(e))

    return APIResponse(
        success=True,
        message=f"Batch successfully uploaded with batch ID: {upload_batch_id}",
        data={"upload_batch_id": upload_batch_id},
        err=None,
    )

@router.get(
    path="/history",
    name="mit:history",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def get_history(
    mit_repo: MITCRUDRepository = fastapi.Depends(get_repository(repo_type=MITCRUDRepository)),
) -> APIResponse:
    history = await mit_repo.get_upload_history()
    return APIResponse(
        success=True,
        message="MIT upload history fetched successfully",
        data=[MitHistoryResponse(**row) for row in history],
        err=None,
    )

@router.get(
    path="",
    name="mit:get-all",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def get_mit_data(
    batch_id: str | None = None,
    year: int | None = None,
    quarter: int | None = None,
    mit_repo: MITCRUDRepository = fastapi.Depends(get_repository(repo_type=MITCRUDRepository)),
) -> APIResponse:
    data = await mit_repo.get_mit_data(batch_id=batch_id, year=year, quarter=quarter)
    return APIResponse(
        success=True,
        message="MIT data fetched successfully",
        data=[MitDataResponse.from_orm(row) for row in data],
        err=None,
    )
