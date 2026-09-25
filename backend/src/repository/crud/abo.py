from src.models.db.abo import ABO
from src.repository.crud.base_monitoring import BaseMonitoringRepository

ABO_MAPPER = {
    "NO_RK": "no_rk",
    "JENIS_KERANGKA_ANGGARAN": "jenis_kerangka_anggaran",
    "ANGGARANWPB_OSF_NILAI_USD": "anggaranwpb_osf_nilai_usd",
    "ANGGARANWPB_OSF_NILAI_IDR": "anggaranwpb_osf_nilai_idr",
    "ANGGARANWPB_OSF_PERCENT": "anggaranwpb_osf_percent",
    "COMMITMENT_SPK_PPN_NILAI_IDR": "commitment_spk_ppn_nilai_idr",
    "COMMITMENT_SPK_PPN_PERCENT": "commitment_spk_ppn_percent",
    "SA_APPROVED_PPN_NILAI_USD": "sa_approved_ppn_nilai_usd",
    "SA_APPROVED_PPN_PERCENT_USD": "sa_approved_ppn_percent_usd",
    "SA_APPROVED_PPN_NILAI_IDR": "sa_approved_ppn_nilai_idr",
    "SA_APPROVED_PPN_PERCENT_IDR": "sa_approved_ppn_percent_idr",
    "ACTUAL_INVOICE_NILAI_USD": "actual_invoice_nilai_usd",
    "ACTUAL_INVOICE_PERCENT_USD": "actual_invoice_percent_usd",
    "ACTUAL_INVOICE_NILAI_IDR": "actual_invoice_nilai_idr",
    "ACTUAL_INVOICE_PERCENT_IDR": "actual_invoice_percent_idr",
    "SISA_ANGGARAN_NILAI_USD": "sisa_anggaran_nilai_usd",
    "SISA_ANGGARAN_PERCENT_USD": "sisa_anggaran_percent_usd",
    "SISA_ANGGARAN_NILAI_IDR": "sisa_anggaran_nilai_idr",
    "SISA_ANGGARAN_PERCENT_IDR": "sisa_anggaran_percent_idr",
    "FLAG": "flag",
}


class ABOCRUDRepository(BaseMonitoringRepository):
    model = ABO
    mapper = ABO_MAPPER
    period_col = "reporting_month"
    date_columns = []
