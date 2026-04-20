import fastapi

from src.api.dependencies.authentication import get_current_account
from src.api.dependencies.repository import get_repository
from src.models.db.account import Account
from src.models.db.project import Project
from src.models.schemas.project import ProjectInCreate, ProjectInUpdate
from src.models.schemas.response import APIResponse
from src.repository.crud.project import ProjectCRUDRepository
from src.utilities.exceptions.database import EntityDoesNotExist

router = fastapi.APIRouter(prefix="/projects", tags=["projects"])


def _project_category(project_value: float | None) -> str | None:
    if project_value is None:
        return None

    if project_value > 5_000_000:
        return "Proyek >IDR 5M"

    return "Proyek <IDR 5M"


def _project_to_data(project: Project) -> dict:
    return {
        "id": project.id,
        "owner_account_id": project.owner_account_id,
        "kategori_proyek": _project_category(project.project_value),
        "earned_value_ev": project.earned_value_ev,
        "planned_value_pv": project.planned_value_pv,
        "actual_cost_ac": project.actual_cost_ac,
        "budget_bac": project.budget_bac,
        "milestone_and_work_stages": project.milestone_and_work_stages,
        "document_project": {
            "document_created_at": project.document_created_at,
            "operational_start_date": project.operational_start_date,
            "estimated_completion_date": project.estimated_completion_date,
            "project_name": project.project_name,
            "project_location": project.project_location,
            "project_value": project.project_value,
            "project_priority": project.project_priority,
            "estimated_progress_percentage": project.estimated_progress_percentage,
        },
        "created_at": project.created_at,
        "updated_at": project.updated_at,
    }


@router.post(path="", name="projects:create", response_model=APIResponse, status_code=fastapi.status.HTTP_201_CREATED)
async def create_project(
    project_create: ProjectInCreate,
    current_account: Account = fastapi.Depends(get_current_account),
    project_repo: ProjectCRUDRepository = fastapi.Depends(get_repository(repo_type=ProjectCRUDRepository)),
) -> APIResponse:
    new_project = await project_repo.create_project(owner_account_id=current_account.id, project_create=project_create)

    return APIResponse(
        success=True,
        message="Project created successfully",
        data=_project_to_data(project=new_project),
        err=None,
    )


@router.get(path="", name="projects:read-all", response_model=APIResponse, status_code=fastapi.status.HTTP_200_OK)
async def get_projects(
    current_account: Account = fastapi.Depends(get_current_account),
    project_repo: ProjectCRUDRepository = fastapi.Depends(get_repository(repo_type=ProjectCRUDRepository)),
) -> APIResponse:
    db_projects = await project_repo.read_projects(owner_account_id=current_account.id)

    return APIResponse(
        success=True,
        message="Projects fetched successfully",
        data=[_project_to_data(project=db_project) for db_project in db_projects],
        err=None,
    )


@router.get(
    path="/{project_id}",
    name="projects:read-by-id",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def get_project(
    project_id: str,
    current_account: Account = fastapi.Depends(get_current_account),
    project_repo: ProjectCRUDRepository = fastapi.Depends(get_repository(repo_type=ProjectCRUDRepository)),
) -> APIResponse:
    try:
        db_project = await project_repo.read_project_by_id(project_id=project_id, owner_account_id=current_account.id)

    except EntityDoesNotExist:
        raise fastapi.HTTPException(status_code=fastapi.status.HTTP_404_NOT_FOUND, detail="Project not found")

    return APIResponse(
        success=True,
        message="Project fetched successfully",
        data=_project_to_data(project=db_project),
        err=None,
    )


@router.patch(
    path="/{project_id}",
    name="projects:update-by-id",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def update_project(
    project_id: str,
    project_update: ProjectInUpdate,
    current_account: Account = fastapi.Depends(get_current_account),
    project_repo: ProjectCRUDRepository = fastapi.Depends(get_repository(repo_type=ProjectCRUDRepository)),
) -> APIResponse:
    try:
        updated_project = await project_repo.update_project_by_id(
            project_id=project_id,
            owner_account_id=current_account.id,
            project_update=project_update,
        )

    except EntityDoesNotExist:
        raise fastapi.HTTPException(status_code=fastapi.status.HTTP_404_NOT_FOUND, detail="Project not found")

    return APIResponse(
        success=True,
        message="Project updated successfully",
        data=_project_to_data(project=updated_project),
        err=None,
    )


@router.delete(
    path="/{project_id}",
    name="projects:delete-by-id",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_200_OK,
)
async def delete_project(
    project_id: str,
    current_account: Account = fastapi.Depends(get_current_account),
    project_repo: ProjectCRUDRepository = fastapi.Depends(get_repository(repo_type=ProjectCRUDRepository)),
) -> APIResponse:
    try:
        deletion_result = await project_repo.delete_project_by_id(
            project_id=project_id, owner_account_id=current_account.id
        )

    except EntityDoesNotExist:
        raise fastapi.HTTPException(status_code=fastapi.status.HTTP_404_NOT_FOUND, detail="Project not found")

    return APIResponse(success=True, message=deletion_result, data={"id": project_id}, err=None)
