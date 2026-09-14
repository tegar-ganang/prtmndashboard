from src.models.db.abi import ABI
from src.repository.crud.base_monitoring import BaseMonitoringRepository

ABI_MAPPER = {
    "REF_WBS": "ref_wbs",
    "WBS": "wbs",
    "NILAI_USD": "nilai_usd",
    "NILAI_IDR": "nilai_idr",
    "NILAI_PERCENT": "nilai_percent",
    "COMMITMENT_NILAI_IDR": "commitment_nilai_idr",
    "COMMITMENT_PERCENT_IDR": "commitment_percent_idr",
    "SA_APPROVED_PPN_IDR": "sa_approved_ppn_idr",
    "SA_APPROVED_PPN_PERCENT": "sa_approved_ppn_percent",
    "ACTUAL_INVOICE_NILAI_IDR": "actual_invoice_nilai_idr",
    "ACTUAL_INVOICE_PERCENT": "actual_invoice_percent",
    "SISA_ANGGARAN_NILAI_IDR": "sisa_anggaran_nilai_idr",
    "SISA_ANGGARAN_PERCENT_IDR": "sisa_anggaran_percent_idr",
    "NILAI_TOTAL_ABI": "nilai_total_abi",
    "KETERANGAN_1": "keterangan_1",
    "KETERANGAN_2": "keterangan_2",
}


class ABICRUDRepository(BaseMonitoringRepository):
    model = ABI
    mapper = ABI_MAPPER
    period_col = "reporting_month"
    date_columns = []
