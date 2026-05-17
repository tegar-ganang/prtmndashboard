import typing
from src.models.db.mit import MIT
from src.repository.crud.base_monitoring import BaseMonitoringRepository

MIT_MAPPER = {
    "Area": "area",
    "No Registration - Lokasi": "reg_lokasi",
    "No Registration - Jenis MIT": "reg_jenis_mit",
    "No Registration - Kategori": "reg_kategori",
    "No Registration - Tahun": "reg_tahun",
    "No Registration - No": "reg_no",
    "MIT Declaration Date": "mit_declaration_date",
    "MIT Title / Asset": "mit_title_asset",
    "Integrity Threats": "integrity_threats",
    "Possible Scenario": "possible_scenario",
    "Consequences": "consequences",
    "Available Safeguard/Control": "available_safeguard",
    "Current Risk - Likelihood": "current_likelihood",
    "Current Risk - Severity": "current_severity",
    "Current Risk - Risk": "current_risk_rating",
    "Rec. No.": "rec_no",
    "Recommendation / Action": "recommendation_action",
    "PIC": "pic",
    "Target Closing": "target_closing",
    "Remarks": "remarks",
    "Target Risk (After implemented Recommendation) - Likelihood": "target_likelihood",
    "Target Risk (After implemented Recommendation) - Severity": "target_severity",
    "Risk": "target_risk_rating",
    "MIT Status": "mit_status",
    "Evidence": "evidence_path",
    "Closing Date": "closing_date",
}

class MITCRUDRepository(BaseMonitoringRepository):
    model = MIT
    mapper = MIT_MAPPER
    period_col = "reporting_quarter"

    # We can keep the specific name get_mit_data if needed by the router, 
    # but the router should preferably use get_data.
    async def get_mit_data(self, **kwargs) -> list[MIT]:
        return await self.get_data(
            batch_id=kwargs.get("batch_id"),
            year=kwargs.get("year"),
            period=kwargs.get("quarter"),
            field=kwargs.get("field")
        )
        
    async def create_batch_mit(self, **kwargs) -> str:
        # Compatibility for existing router call
        return await self.create_batch(batch_data=kwargs.get("batch_data"), owner_account_id=kwargs.get("owner_account_id"))
