import fastapi

from src.api.dependencies.authentication import get_current_account
from src.api.dependencies.repository import get_repository
from src.models.db.account import Account
from src.models.schemas.mit import DocumentBatchCreate
from src.models.schemas.response import APIResponse
from src.repository.crud.mit import MITCRUDRepository

router = fastapi.APIRouter(prefix="/mit", tags=["mit"], dependencies=[fastapi.Depends(get_current_account)])

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
