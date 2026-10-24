import types

from src.api.routes.project import _project_to_data


def _project(stored: float):
    fields = dict(
        id="p1", owner_account_id=None, project_value=None, earned_value_ev=0, planned_value_pv=0, actual_cost_ac=0,
        budget_bac=0, milestone_and_work_stages=None, document_created_at=None, operational_start_date=None,
        estimated_completion_date=None, project_name="X", pic=None, project_location="L", project_priority="HIGH", project_type="BD",
        status="PRE_EKSEKUSI", owner_project=None,
        estimated_progress_percentage=stored, created_at=None, updated_at=None,
    )
    return types.SimpleNamespace(**fields)


def test_progress_uses_latest_scurve_actual_and_falls_back_to_stored() -> None:
    assert _project_to_data(_project(0.0), scurve_progress=96.38)["document_project"]["estimated_progress_percentage"] == 96.38
    assert _project_to_data(_project(12.5))["document_project"]["estimated_progress_percentage"] == 12.5


def test_project_type_normalised_and_restricted() -> None:
    import pydantic
    import pytest

    from src.models.schemas.project import ProjectInUpdate

    assert ProjectInUpdate(project_type="non_bd").project_type == "NON_BD"
    with pytest.raises(pydantic.ValidationError):
        ProjectInUpdate(project_type="OTHER")


def test_duration_days_and_status_is_one_way() -> None:
    import datetime

    import pydantic
    import pytest

    from src.api.routes.project import _duration_days
    from src.models.schemas.project import ProjectInUpdate

    assert _duration_days(datetime.date(2026, 1, 1), datetime.date(2026, 1, 31)) == 30
    assert _duration_days(None, datetime.date(2026, 1, 31)) is None
    assert ProjectInUpdate(status="eksekusi").status == "EKSEKUSI"
    with pytest.raises(pydantic.ValidationError):
        ProjectInUpdate(status="PRE_EKSEKUSI")
