from src.models.db.hazid import Hazid
from src.repository.crud.base_monitoring import BaseMonitoringRepository

HAZID_MAPPER = {
    "NODE NO": "node_no",
    "REC. NO.": "rec_no",
    "NODE": "node",
    "GUIDEWORD": "guideword",
    "HAZARD": "hazard",
    "CONSEQUENCES": "consequences",
    "SAFEGUARD": "safeguard",
    "RECOMMENDATION": "recommendation",
    "LIKELIHOOD": "likelihood",
    "SEVERITY": "severity",
    "RISK": "risk",
    "RESPONSIBILITY/PIC": "responsibility_pic",
    "TYPE": "type",
    "TARGET DATE": "target_date",
    "RESPONSE / PROGRESS": "response_progress",
    "CATEGORY": "category",
    "SUB CATEGORY": "sub_category",
    "STATUS": "status",
    "EVIDENCE": "evidence",
    "COMPLETION DATE": "completion_date",
}

class HazidCRUDRepository(BaseMonitoringRepository):
    model = Hazid
    mapper = HAZID_MAPPER
    period_col = "reporting_month"
