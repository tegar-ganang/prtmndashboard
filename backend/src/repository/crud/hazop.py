from src.models.db.hazop import Hazop
from src.repository.crud.base_monitoring import BaseMonitoringRepository

HAZOP_MAPPER = {
    "NODE NO": "node_no",
    "REC. NO.": "rec_no",
    "NODE": "node",
    "DEVIATION": "deviation",
    "POSSIBLE CAUSE": "possible_cause",
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
    "SME": "sme",
}

class HazopCRUDRepository(BaseMonitoringRepository):
    model = Hazop
    mapper = HAZOP_MAPPER
    period_col = "reporting_month"
