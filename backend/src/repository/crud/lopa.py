from src.models.db.lopa import Lopa
from src.repository.crud.base_monitoring import BaseMonitoringRepository

LOPA_MAPPER = {
    "FUNCTION NO.": "function_no",
    "FUNCTION NAME": "function_name",
    "FUNCTION DESCRIPTION": "function_description",
    "FINAL ELEMENT": "final_element",
    "RECOMMENDATION": "recommendation",
    "RRF GAP VALUE": "rrf_gap_value",
    "RRF GAP TYPE": "rrf_gap_type",
    "RESPONSIBILITY/PIC": "responsibility_pic",
    "TARGET DATE": "target_date",
    "REMINDER STATUS": "reminder_status",
    "RESPONSE / PROGRESS": "response_progress",
    "STATUS": "status",
    "EVIDENCE": "evidence",
    "COMPLETION DATE": "completion_date",
}

class LopaCRUDRepository(BaseMonitoringRepository):
    model = Lopa
    mapper = LOPA_MAPPER
    period_col = "reporting_month"
