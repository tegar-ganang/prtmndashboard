import fastapi

from src.api.dependencies.authentication import get_current_account
from src.api.dependencies.repository import get_repository
from src.models.schemas.location import FieldLocationResponse
from src.models.schemas.response import APIResponse
from src.repository.crud.location import FieldLocationCRUDRepository

router = fastapi.APIRouter(prefix="/locations", tags=["locations"], dependencies=[fastapi.Depends(get_current_account)])

@router.get(
    path="",
    name="locations:get-all",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def get_all_locations(
    location_repo: FieldLocationCRUDRepository = fastapi.Depends(get_repository(repo_type=FieldLocationCRUDRepository)),
) -> APIResponse:
    locations = await location_repo.get_all_locations()
    data = [FieldLocationResponse.from_orm(loc) for loc in locations]
    return APIResponse(
        success=True,
        data=data,
        message="Locations fetched successfully",
        err=None,
    )
