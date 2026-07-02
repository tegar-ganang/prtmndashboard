from src.models.db.hsse import HSSE
from src.repository.crud.base_monitoring import BaseMonitoringRepository

HSSE_MAPPER = {
    "ID_Izin": "id_izin",
    "Tanggal": "tanggal",
    "Bulan_Tahun": "bulan_tahun",
    "Lokasi": "lokasi",
    "Jenis_Izin_Kerja": "jenis_izin_kerja",
    "Job_Complete": "job_complete",
    "Jumlah_ICC": "jumlah_icc",
    "Status_Dispensasi": "status_dispensasi",
    "Jenis_Deviasi": "jenis_deviasi",
    "Status_Deviasi": "status_deviasi",
    "Tingkat_Resiko": "tingkat_resiko",
}


class HSSECRUDRepository(BaseMonitoringRepository):
    model = HSSE
    mapper = HSSE_MAPPER
    period_col = "reporting_month"
    date_columns = ["tanggal"]
