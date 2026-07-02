from src.models.db.airms import AIRMS
from src.repository.crud.base_monitoring import BaseMonitoringRepository

AIRMS_MAPPER = {
    "record_id": "record_id",
    "date": "date",
    "asset_id": "asset_id",
    "asset_name": "asset_name",
    "area": "area",
    "availability": "availability",
    "reliability": "reliability",
    "mtbf": "mtbf",
    "mttr": "mttr",
    "wo_type": "wo_type",
    "wo_status": "wo_status",
    "maintenance_cost": "maintenance_cost",
    "downtime_type": "downtime_type",
    "downtime_hours": "downtime_hours",
    "lost_boe": "lost_boe",
    "health_index": "health_index",
}


class AIRMSCRUDRepository(BaseMonitoringRepository):
    model = AIRMS
    mapper = AIRMS_MAPPER
    period_col = "reporting_month"
    date_columns = ["date"]
