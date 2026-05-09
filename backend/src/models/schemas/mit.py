import typing
import datetime
from src.models.schemas.base import BaseSchemaModel

class DocumentBatchCreate(BaseSchemaModel):
    doc_type: str
    items: list[dict[str, typing.Any]]

# Keeping MITResponse for when querying data (if needed)
class MITResponse(BaseSchemaModel):
    id: str
    upload_batch_id: str
    owner_account_id: str | None
    area: str | None
    reg_lokasi: str | None
    reg_jenis_mit: str | None
    reg_kategori: str | None
    reg_tahun: str | None
    reg_no: str | None
    mit_declaration_date: datetime.date | None
    mit_title_asset: str | None
    integrity_threats: str | None
    possible_scenario: str | None
    consequences: str | None
    available_safeguard: str | None
    current_likelihood: str | None
    current_severity: str | None
    current_risk_rating: str | None
    rec_no: str | None
    recommendation_action: str | None
    pic: str | None
    target_closing: datetime.date | None
    remarks: str | None
    target_likelihood: str | None
    target_severity: str | None
    target_risk_rating: str | None
    mit_status: str | None
    evidence_path: str | None
    closing_date: datetime.date | None
    created_at: datetime.datetime
    updated_at: datetime.datetime | None
