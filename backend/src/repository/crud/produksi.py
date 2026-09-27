import typing
import uuid
import pandas as pd
from io import BytesIO
from datetime import datetime, timezone

import sqlalchemy
from sqlalchemy.orm import noload
from sqlalchemy.sql import functions as sqlalchemy_functions

from src.models.db.produksi import Produksi
from src.models.db.produksi_target import ProduksiTarget
from src.repository.crud.base import BaseCRUDRepository


# Header Sheet 2 (uppercase, spasi dirapikan) → kolom ProduksiTarget.
# "KONDENSAT" polos = format lama sebelum RKAP/WP&B dipisah; tetap ke kolom lamanya.
_TARGET_HEADERS = {
    "DMF": "target_dmf",
    "GAS WP&B": "target_gas_wpb",
    "KONDENSAT": "target_kondensat",
    "KONDENSAT RKAP": "target_kondensat_rkap",
    "KONDENSAT WP&B": "target_kondensat_wpb",
}


def _safe_float(val: typing.Any) -> float | None:
    """Convert a cell value to float, returning None for missing/NaN values."""
    if val is None:
        return None
    try:
        import math
        f = float(val)
        return None if math.isnan(f) else f
    except (TypeError, ValueError):
        return None


def _parse_date(val: typing.Any):
    """Parse a cell value to a Python date object."""
    if val is None:
        return None
    if isinstance(val, datetime):
        return val.date()
    if hasattr(val, "date"):
        return val.date()
    try:
        return pd.to_datetime(val).date()
    except Exception:
        return None


class ProduksiCRUDRepository(BaseCRUDRepository):

    # ──────────────────────────────────────────────────────────────────────────
    # Read helpers
    # ──────────────────────────────────────────────────────────────────────────

    async def get_upload_history(self) -> typing.List[dict[str, typing.Any]]:
        stmt = (
            sqlalchemy.select(
                Produksi.upload_batch_id,
                Produksi.reporting_year,
                Produksi.reporting_month,
                Produksi.field,
                sqlalchemy.func.min(Produksi.created_at).label("upload_date"),
                sqlalchemy.func.count(Produksi.id).label("record_count"),
            )
            .group_by(
                Produksi.upload_batch_id,
                Produksi.reporting_year,
                Produksi.reporting_month,
                Produksi.field,
            )
            .order_by(sqlalchemy.func.min(Produksi.created_at).desc())
        )
        res = await self.async_session.execute(stmt)
        return [dict(row._mapping) for row in res.fetchall()]

    async def get_data(
        self,
        batch_id: str | None = None,
        year: int | None = None,
        month: int | None = None,
        field: str | None = None,
    ) -> typing.Sequence[Produksi]:
        """Fetch realisasi harian rows. Target bulanan dapat diakses via row.target."""
        stmt = sqlalchemy.select(Produksi).order_by(Produksi.tanggal.asc())
        if batch_id:
            stmt = stmt.where(Produksi.upload_batch_id == batch_id)
        if year is not None:
            stmt = stmt.where(Produksi.reporting_year == year)
        if month is not None:
            stmt = stmt.where(Produksi.reporting_month == month)
        if field is not None:
            stmt = stmt.where(Produksi.field == field)

        # ponytail: safety cap, not real pagination — see base_monitoring.get_data.
        stmt = stmt.limit(5000)

        res = await self.async_session.execute(stmt)
        return res.scalars().all()

    async def get_targets(
        self,
        year: int | None = None,
        month: int | None = None,
        field: str | None = None,
    ) -> typing.Sequence[ProduksiTarget]:
        """Fetch target bulanan rows secara langsung dari tabel produksi_target."""
        stmt = sqlalchemy.select(ProduksiTarget).order_by(
            ProduksiTarget.reporting_year.asc(),
            ProduksiTarget.reporting_month.asc(),
        )
        if year is not None:
            stmt = stmt.where(ProduksiTarget.reporting_year == year)
        if month is not None:
            stmt = stmt.where(ProduksiTarget.reporting_month == month)
        if field is not None:
            stmt = stmt.where(ProduksiTarget.field == field)

        res = await self.async_session.execute(stmt)
        return res.scalars().all()

    async def check_period_exists(
        self, year: int, month: int, field: str | None = None
    ) -> bool:
        conditions = [
            Produksi.reporting_year == year,
            Produksi.reporting_month == month,
        ]
        if field is not None:
            conditions.append(Produksi.field == field)

        stmt = sqlalchemy.select(Produksi.id).where(*conditions).limit(1)
        res = await self.async_session.execute(stmt)
        return res.first() is not None

    # ──────────────────────────────────────────────────────────────────────────
    # Excel Parser + Bulk Insert (2 tabel terpisah)
    # ──────────────────────────────────────────────────────────────────────────

    async def process_excel_and_save(
        self,
        file_content: bytes,
        owner_account_id: str,
        reporting_year: int,
        reporting_month: int,
        field: str | None = None,
        mode: str = "append",
    ) -> str:
        upload_batch_uuid = uuid.uuid4()
        owner_account_uuid = uuid.UUID(owner_account_id) if isinstance(owner_account_id, str) else owner_account_id

        xls = pd.ExcelFile(BytesIO(file_content))
        if len(xls.sheet_names) < 2:
            raise ValueError(
                "File Excel harus memiliki minimal 2 sheet "
                "(Sheet1: Harian/Realisasi, Sheet2: Target Bulanan)."
            )

        # ── 1. Parse Sheet 2 (Target Bulanan) → simpan ke produksi_target ─────
        #
        # Format Sheet 2:
        #   Row 0: "TARGET MMSCFD" label
        #   Row 1: "BULAN", "DMF", "GAS WP&B", "KONDENSAT RKAP", "KONDENSAT WP&B"
        #   Row 2+: data rows (tanggal bulan, lalu nilai target per kolom)
        # Kolom dicocokkan lewat nama header (bukan posisi) supaya urutan kolom bebas.
        df_target_raw = pd.read_excel(xls, sheet_name=1, header=None)
        target_cols = {
            _TARGET_HEADERS[h]: i
            for i, h in enumerate(" ".join(str(v).upper().split()) for v in df_target_raw.iloc[1:2].values.flatten())
            if h in _TARGET_HEADERS
        }
        if "target_dmf" not in target_cols:
            raise ValueError(
                "Sheet 2 (Target Bulanan) harus punya header kolom 'DMF' di baris ke-2. "
                "Kolom lain yang dikenali: GAS WP&B, KONDENSAT RKAP, KONDENSAT WP&B."
            )

        # (tahun, bulan) → nilai kolom target; bulan yang dobel di sheet: baris terakhir menang
        parsed_targets: dict[tuple[int, int], dict[str, float | None]] = {}

        for _, row in df_target_raw.iloc[2:].iterrows():
            bulan_val = row.iloc[0]
            dmf_val = row.iloc[target_cols["target_dmf"]]
            if pd.isna(bulan_val) or pd.isna(dmf_val):
                continue
            month_date = _parse_date(bulan_val)
            if month_date is not None:
                target_year = month_date.year if month_date.year > 2000 else reporting_year
                parsed_targets[(target_year, month_date.month)] = {
                    attr: _safe_float(row.iloc[i]) for attr, i in target_cols.items()
                }

        if mode == "overwrite":
            # Hapus realisasi dulu (FK dependency)
            conditions_realisasi = [
                Produksi.reporting_year == reporting_year,
                Produksi.reporting_month == reporting_month,
            ]
            if field is not None:
                conditions_realisasi.append(Produksi.field == field)
            await self.async_session.execute(sqlalchemy.delete(Produksi).where(*conditions_realisasi))
            await self.async_session.flush()
            # Target tidak dihapus di sini: di-upsert di bawah (baris target dirujuk realisasi bulan lain via FK).

        # ── Upsert target, key = (reporting_year, reporting_month) ────────────
        # Baris yang sudah ada di-update di tempat (id tetap → FK realisasi lama tidak putus),
        # insert hanya untuk bulan yang belum ada. Duplikat lama untuk bulan yang sama dirapikan:
        # realisasinya dialihkan ke baris terbaru, lalu duplikatnya dihapus.
        # ponytail: tanpa unique index di DB, dua upload bersamaan masih bisa dobel; tambah
        # UNIQUE (reporting_year, reporting_month) setelah data lama bersih kalau itu jadi masalah.
        existing: dict[tuple[int, int], ProduksiTarget] = {}
        duplicates: list[tuple[ProduksiTarget, ProduksiTarget]] = []  # (duplikat, yang dipertahankan)
        if parsed_targets:
            res = await self.async_session.execute(
                sqlalchemy.select(ProduksiTarget)
                .options(noload(ProduksiTarget.realisasi_rows))
                .where(ProduksiTarget.reporting_year.in_({year for year, _ in parsed_targets}))
                .order_by(ProduksiTarget.created_at.desc())
            )
            for t in res.scalars().all():  # terbaru dulu
                key = (t.reporting_year, t.reporting_month)
                if key not in parsed_targets:
                    continue
                if key in existing:
                    duplicates.append((t, existing[key]))
                else:
                    existing[key] = t

        # dict: month_int → ProduksiTarget (ORM object) yang di-upsert
        target_by_month: dict[int, ProduksiTarget] = {}
        new_targets: list[ProduksiTarget] = []
        for (target_year, target_month), values in parsed_targets.items():
            target_obj = existing.get((target_year, target_month))
            if target_obj is None:
                target_obj = ProduksiTarget(id=uuid.uuid4(), reporting_year=target_year, reporting_month=target_month)
                new_targets.append(target_obj)
            else:
                target_obj.updated_at = datetime.now(timezone.utc)
            target_obj.upload_batch_id = upload_batch_uuid
            target_obj.owner_account_id = owner_account_uuid
            target_obj.field = field
            for attr, val in values.items():  # hanya kolom yang ada di sheet, kolom lain tidak ditimpa
                setattr(target_obj, attr, val)
            target_by_month[target_month] = target_obj

        for dup, keep in duplicates:
            await self.async_session.execute(
                sqlalchemy.update(Produksi).where(Produksi.target_id == dup.id).values(target_id=keep.id)
            )
            await self.async_session.execute(sqlalchemy.delete(ProduksiTarget).where(ProduksiTarget.id == dup.id))

        if new_targets:
            self.async_session.add_all(new_targets)
        await self.async_session.flush()  # flush agar id target baru terisi

        df_raw = pd.read_excel(xls, sheet_name=0, header=None)

        # Row 0 = group headers (beberapa cell None karena Excel merge)
        # Row 1 = sub-headers
        # Row 2+ = data

        group_row = df_raw.iloc[0].tolist()
        sub_row = df_raw.iloc[1].tolist()

        # Forward-fill group names (merged cells show NaN on subsequent cols)
        last_group = ""
        combined_headers: list[str] = []
        for i, (grp, sub) in enumerate(zip(group_row, sub_row)):
            if i == 0:
                # Column A = Tanggal (no group prefix needed)
                combined_headers.append("tanggal")
                last_group = ""
                continue
            # Check for a new non-null, non-NaN group name
            if grp is not None:
                grp_str = str(grp).strip()
                if grp_str and grp_str.lower() != "nan":
                    last_group = grp_str
            sub_str = str(sub).strip() if sub is not None and str(sub).strip().lower() != "nan" else ""
            combined_headers.append(f"{last_group}|{sub_str}" if sub_str else last_group)

        # Map combined header → DB column name
        HEADER_MAP: dict[str, str] = {
            "tanggal": "tanggal",
            "ANGKA PRODUKSI PUPO / SOT (BOPD)|Target":    "pupo_sot_target",
            "ANGKA PRODUKSI PUPO / SOT (BOPD)|Real":      "pupo_sot_real",
            "ANGKA PRODUKSI PUPO / SOT (BOPD)|Donggi":    "pupo_sot_donggi",
            "ANGKA PRODUKSI PUPO / SOT (BOPD)|Matindok":  "pupo_sot_matindok",
            "ANGKA PRODUKSI OPERASI (BOPD)|Target":        "op_target",
            "ANGKA PRODUKSI OPERASI (BOPD)|Real":          "op_real",
            "ANGKA PRODUKSI OPERASI (BOPD)|Donggi":        "op_donggi",
            "ANGKA PRODUKSI OPERASI (BOPD)|Matindok":      "op_matindok",
            "PRODUKSI GAS MMSCFD - DONGGI FIELD|Prod":          "donggi_prod",
            "PRODUKSI GAS MMSCFD - DONGGI FIELD|Own Use":       "donggi_own_use",
            "PRODUKSI GAS MMSCFD - DONGGI FIELD|Sales":         "donggi_sales",
            "PRODUKSI GAS MMSCFD - DONGGI FIELD|Main Flare":    "donggi_main_flare",
            "PRODUKSI GAS MMSCFD - DONGGI FIELD|Acid Flare":    "donggi_acid_flare",
            "PRODUKSI GAS MMSCFD - DONGGI FIELD|Venting CO2":   "donggi_venting_co2",
            "PRODUKSI GAS MMSCFD - DONGGI FIELD|Losses":        "donggi_losses",
            "PRODUKSI GAS MMSCFD - MATINDOK FIELD|Prod":        "matindok_prod",
            "PRODUKSI GAS MMSCFD - MATINDOK FIELD|Own Use":     "matindok_own_use",
            "PRODUKSI GAS MMSCFD - MATINDOK FIELD|Sales":       "matindok_sales",
            "PRODUKSI GAS MMSCFD - MATINDOK FIELD|Main Flare":  "matindok_main_flare",
            "PRODUKSI GAS MMSCFD - MATINDOK FIELD|Acid Flare":  "matindok_acid_flare",
            "PRODUKSI GAS MMSCFD - MATINDOK FIELD|Venting CO2": "matindok_venting_co2",
            "PRODUKSI GAS MMSCFD - MATINDOK FIELD|Losses":      "matindok_losses",
            "BBLS - DONGGI MATINDOK FIELD|Processed & Produced Water": "bbls_processed_water",
            "BBLS - DONGGI MATINDOK FIELD|Water Injection":             "bbls_water_injection",
            "BBLS - DONGGI MATINDOK FIELD|Closing Stock":               "bbls_closing_stock",
            "BBLS - DONGGI MATINDOK FIELD|ACTL":                        "bbls_actl",
            "SAFE MAN HOURS|DONGGI MATINDOK FIELD":        "safe_man_hours_dmf",
            "SAFE MAN HOURS |DONGGI MATINDOK FIELD":       "safe_man_hours_dmf",
        }

        # Build index → db_column mapping from actual file headers
        col_index_map: dict[int, str] = {}
        normalized_header_map = {k.strip(): v for k, v in HEADER_MAP.items()}
        for idx, combined in enumerate(combined_headers):
            db_col = normalized_header_map.get(combined.strip())
            if db_col:
                col_index_map[idx] = db_col

        records: list[Produksi] = []
        data_rows = df_raw.iloc[2:].values.tolist()

        for row_data in data_rows:
            # Parse tanggal (column index 0)
            tgl = _parse_date(row_data[0])
            if tgl is None:
                continue  # skip rows without a valid date

            # Skip rows where ALL numeric columns are empty (summary/footer rows)
            numeric_vals = [row_data[i] for i in col_index_map if i > 0]
            if all(v is None or (isinstance(v, float) and pd.isna(v)) for v in numeric_vals):
                continue

            # Lookup target FK untuk bulan ini
            month_num = tgl.month
            target_obj = target_by_month.get(month_num)
            target_id = target_obj.id if target_obj is not None else None

            # Build kwargs dari mapped columns
            kwargs: dict[str, typing.Any] = {
                "id": uuid.uuid4(),
                "upload_batch_id": upload_batch_uuid,
                "owner_account_id": owner_account_uuid,
                "target_id": target_id,
                "reporting_year": reporting_year,
                "reporting_month": reporting_month,
                "field": field,
                "tanggal": tgl,
            }

            for col_idx, db_col in col_index_map.items():
                if db_col == "tanggal":
                    continue  # already set
                val = row_data[col_idx] if col_idx < len(row_data) else None
                kwargs[db_col] = _safe_float(val)

            records.append(Produksi(**kwargs))

        if records:
            self.async_session.add_all(records)
            await self.async_session.commit()
        elif target_by_month:
            # Commit target meski tidak ada realisasi (edge case)
            await self.async_session.commit()

        return str(upload_batch_uuid)
