import datetime

import pydantic

from src.models.schemas.base import BaseSchemaModel


class ProjectInCreate(BaseSchemaModel):
    document_created_at: datetime.date
    operational_start_date: datetime.date
    estimated_completion_date: datetime.date
    project_name: str
    project_location: str
    project_value: float | None = None
    project_priority: pydantic.constr(to_lower=True, regex="^(high|mid|low)$")  # type: ignore
    estimated_progress_percentage: float = pydantic.Field(ge=0, le=100, default=0)
    earned_value_ev: float = 0
    planned_value_pv: float = 0
    actual_cost_ac: float = 0
    budget_bac: float = 0
    milestone_and_work_stages: str | None = None


class ProjectInUpdate(BaseSchemaModel):
    document_created_at: datetime.date | None = None
    operational_start_date: datetime.date | None = None
    estimated_completion_date: datetime.date | None = None
    project_name: str | None = None
    project_location: str | None = None
    project_value: float | None = None
    project_priority: pydantic.constr(to_lower=True, regex="^(high|mid|low)$") | None = None  # type: ignore
    estimated_progress_percentage: float | None = pydantic.Field(default=None, ge=0, le=100)
    earned_value_ev: float | None = None
    planned_value_pv: float | None = None
    actual_cost_ac: float | None = None
    budget_bac: float | None = None
    milestone_and_work_stages: str | None = None
