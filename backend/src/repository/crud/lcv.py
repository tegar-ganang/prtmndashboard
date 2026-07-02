from src.models.db.lcv import LCVProjectCharterBudaya, LCVMonitoring
from src.repository.crud.base_monitoring import BaseMonitoringRepository

LCV_PROJECT_CHARTER_BUDAYA_MAPPER = {
    "id_project": "id_project",
    "tanggal": "tanggal",
    "judul_project": "judul_project",
}

LCV_MONITORING_MAPPER = {
    "namapegawai": "namapegawai",
    "nip": "nip",
    "departemen": "departemen",
    "lcv_conflictofinterest": "lcv_conflictofinterest",
    "lcv_codeofconduct": "lcv_codeofconduct",
    "lcv_laporgratifikasi": "lcv_laporgratifikasi",
    "lcv_sosialisasi_lcv": "lcv_sosialisasi_lcv",
    "lcv_lhkpn": "lcv_lhkpn",
    "training_isec": "training_isec",
    "training_lcv": "training_lcv",
    "trainining_virtualdemoroomhsse": "trainining_virtualdemoroomhsse",
    "training_stressmanagement": "training_stressmanagement",
    "training_fraudawareness": "training_fraudawareness",
    "projectchapterbudaya": "projectchapterbudaya",
    "tahun": "tahun",
}


class LCVProjectCharterBudayaCRUDRepository(BaseMonitoringRepository):
    model = LCVProjectCharterBudaya
    mapper = LCV_PROJECT_CHARTER_BUDAYA_MAPPER
    period_col = "reporting_month"
    date_columns = ["tanggal"]


class LCVMonitoringCRUDRepository(BaseMonitoringRepository):
    model = LCVMonitoring
    mapper = LCV_MONITORING_MAPPER
    period_col = "reporting_month"
    date_columns = []
