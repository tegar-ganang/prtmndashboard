from src.models.db.i2aims import I2AIMS
from src.repository.crud.base_monitoring import BaseMonitoringRepository

I2AIMS_MAPPER = {
    "record_id": "record_id",
    "inspection_date": "inspection_date",
    "asset_id": "asset_id",
    "asset_name": "asset_name",
    "asset_type": "asset_type",
    "area": "area",
    "sce_category": "sce_category",
    "integrity_status": "integrity_status",
    "inspection_result": "inspection_result",
    "inspection_compliance": "inspection_compliance",
    "corrosion_rate": "corrosion_rate",
    "remaining_life": "remaining_life",
    "risk_rank": "risk_rank",
    "anomaly_count": "anomaly_count",
    "process_safety_event": "process_safety_event",
    "barrier_health": "barrier_health",
    "recommendation_status": "recommendation_status",
    "inspection_cost": "inspection_cost",
}


class I2AIMSCRUDRepository(BaseMonitoringRepository):
    model = I2AIMS
    mapper = I2AIMS_MAPPER
    period_col = "reporting_month"
    date_columns = ["inspection_date"]
