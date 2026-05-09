import typing
import uuid
from datetime import datetime, date

import sqlalchemy
from sqlalchemy.sql import functions as sqlalchemy_functions

from src.models.db.mit import MIT
from src.models.schemas.mit import DocumentBatchCreate
from src.repository.crud.base import BaseCRUDRepository

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

TRUNKLINE_MAPPER = {
    # Placeholder for Trunkline mapping
    "Pipeline Name": "pipeline_name",
    "Diameter": "diameter_inch",
}

def parse_date(date_str: str | None) -> date | None:
    if not date_str:
        return None
    try:
        # Assuming format is YYYY-MM-DD from frontend
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return None

class MITCRUDRepository(BaseCRUDRepository):
    async def create_batch_mit(self, batch_data: DocumentBatchCreate, owner_account_id: str) -> str:
        upload_batch_id = str(uuid.uuid4())
        
        selected_mapper = MIT_MAPPER if batch_data.doc_type == "MIT" else TRUNKLINE_MAPPER
        
        mit_objects = []
        for item in batch_data.items:
            # Create a dictionary to hold the kwargs for the MIT model
            kwargs = {
                "upload_batch_id": upload_batch_id,
                "owner_account_id": owner_account_id,
            }
            
            for excel_header, db_column in selected_mapper.items():
                value = item.get(excel_header)
                # Handle dates properly
                if db_column in ["mit_declaration_date", "target_closing", "closing_date"]:
                    kwargs[db_column] = parse_date(value)
                else:
                    # Convert to string if not None, as most fields are strings
                    kwargs[db_column] = str(value) if value is not None else None
            
            # Since Trunkline is not implemented yet, we only support MIT insertion
            if batch_data.doc_type == "MIT":
                mit_obj = MIT(**kwargs)
                mit_objects.append(mit_obj)
            
        if mit_objects:
            self.async_session.add_all(mit_objects)
            await self.async_session.commit()
            
        return upload_batch_id
