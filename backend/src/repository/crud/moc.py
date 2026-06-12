from src.models.db.moc import MOC
from src.repository.crud.base_monitoring import BaseMonitoringRepository

MOC_MAPPER = {
    "MOC_NUMBER": "moc_number",
    "CHANGE_DESC": "change_desc",
    "ISSUED_DATE": "issued_date",
    "DONE": "done",
    "MOC_OWNER": "moc_owner",
    "LAST_UPDATED": "last_updated",
    "ONGOING_STEP": "ongoing_step",
    "PIC": "pic",
    "STATUS": "status",
}


class MOCCRUDRepository(BaseMonitoringRepository):
    model = MOC
    mapper = MOC_MAPPER
    period_col = "reporting_month"
    date_columns = ["issued_date", "last_updated"]
