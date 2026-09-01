import pathlib

import fastapi
from fastapi.responses import FileResponse

from src.api.dependencies.authentication import get_current_account
from src.api.dependencies.rbac import require_menu_access
from src.api.dependencies.repository import get_repository
from src.models.db.account import Account
from src.models.db.project_progress import ProjectProgress
from src.models.db.project_progress_summary import ProjectProgressSummary
from src.models.db.project_scurve_upload import ProjectScurveUpload
from src.models.schemas.response import APIResponse
from src.repository.crud.project_scurve import ProjectScurveCRUDRepository

router = fastapi.APIRouter(
    prefix="/projects/{project_id}/scurve",
    tags=["project-scurve"],
    dependencies=[fastapi.Depends(require_menu_access("project"))],
)


def _progress_to_data(row: ProjectProgress) -> dict:
    return {
        "id": row.id,
        "periode_data": row.periode_data,
        "item_no": row.item_no,
        "description": row.description,
        "wf": row.wf,
        "previous_week_plan": row.previous_week_plan,
        "previous_week_actual": row.previous_week_actual,
        "previous_week_variance": row.previous_week_variance,
        "this_week_plan": row.this_week_plan,
        "this_week_actual": row.this_week_actual,
        "this_week_variance": row.this_week_variance,
        "to_date_plan": row.to_date_plan,
        "to_date_actual": row.to_date_actual,
        "to_date_variance": row.to_date_variance,
        "remarks": row.remarks,
    }


def _summary_to_data(row: ProjectProgressSummary) -> dict:
    return {
        "id": row.id,
        "progress_date": row.progress_date,
        "actual_this_week": row.actual_this_week,
        "actual_cumulative": row.actual_cumulative,
        "plan_this_week": row.plan_this_week,
        "plan_cumulative": row.plan_cumulative,
        "variance_to_plan": row.variance_to_plan,
    }


def _upload_to_data(row: ProjectScurveUpload) -> dict:
    return {
        "id": row.id,
        "file_name": row.file_name,
        "uploaded_by_account_id": row.uploaded_by_account_id,
        "uploaded_at": row.uploaded_at,
    }


@router.post(
    path="/upload",
    name="project-scurve:upload",
    response_model=APIResponse,
    status_code=fastapi.status.HTTP_201_CREATED,
    dependencies=[fastapi.Depends(require_menu_access("project", require_upload=True))],
)
async def upload_scurve(
    project_id: str,
    file: fastapi.UploadFile,
    current_account: Account = fastapi.Depends(get_current_account),
    repo: ProjectScurveCRUDRepository = fastapi.Depends(get_repository(repo_type=ProjectScurveCRUDRepository)),
) -> APIResponse:
    try:
        content = await file.read()
        result = await repo.import_excel(
            project_id=project_id,
            file_content=content,
            file_name=file.filename or "scurve.xlsx",
            uploaded_by_account_id=str(current_account.id),
        )
    except ValueError as e:
        raise fastapi.HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise fastapi.HTTPException(status_code=400, detail=f"Gagal memproses file Excel: {str(e)}")

    return APIResponse(success=True, message="S-Curve berhasil diimpor", data=result, err=None)


@router.get(path="/progress", name="project-scurve:progress", response_model=APIResponse, status_code=fastapi.status.HTTP_200_OK)
async def get_progress(
    project_id: str,
    repo: ProjectScurveCRUDRepository = fastapi.Depends(get_repository(repo_type=ProjectScurveCRUDRepository)),
) -> APIResponse:
    rows = await repo.read_progress(project_id=project_id)
    return APIResponse(success=True, message="Progress fetched successfully", data=[_progress_to_data(r) for r in rows], err=None)


@router.get(path="/summary", name="project-scurve:summary", response_model=APIResponse, status_code=fastapi.status.HTTP_200_OK)
async def get_summary(
    project_id: str,
    repo: ProjectScurveCRUDRepository = fastapi.Depends(get_repository(repo_type=ProjectScurveCRUDRepository)),
) -> APIResponse:
    rows = await repo.read_summary(project_id=project_id)
    return APIResponse(success=True, message="Summary fetched successfully", data=[_summary_to_data(r) for r in rows], err=None)


@router.get(path="/uploads", name="project-scurve:uploads", response_model=APIResponse, status_code=fastapi.status.HTTP_200_OK)
async def get_uploads(
    project_id: str,
    repo: ProjectScurveCRUDRepository = fastapi.Depends(get_repository(repo_type=ProjectScurveCRUDRepository)),
) -> APIResponse:
    rows = await repo.read_uploads(project_id=project_id)
    return APIResponse(success=True, message="Upload history fetched successfully", data=[_upload_to_data(r) for r in rows], err=None)


@router.get(path="/uploads/{upload_id}/download", name="project-scurve:download")
async def download_scurve_upload(
    project_id: str,
    upload_id: str,
    repo: ProjectScurveCRUDRepository = fastapi.Depends(get_repository(repo_type=ProjectScurveCRUDRepository)),
) -> FileResponse:
    upload = await repo.read_upload_by_id(project_id=project_id, upload_id=upload_id)
    if upload is None or not pathlib.Path(upload.file_path).is_file():
        raise fastapi.HTTPException(status_code=404, detail="File upload tidak ditemukan")

    return FileResponse(
        path=upload.file_path,
        filename=upload.file_name,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
