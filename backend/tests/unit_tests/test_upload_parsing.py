from datetime import date

from src.repository.crud.base_monitoring import parse_date
from src.repository.crud.zona_pse_list import _parse_time


def test_parse_date_handles_excel_serial_and_keeps_bare_year() -> None:
    # "General"-formatted date cells arrive as Excel serial numbers and used to become NULL.
    assert parse_date(45659) == date(2025, 1, 2)
    assert parse_date(2025) == date(2025, 1, 1)
    assert parse_date("2025-03-21") == date(2025, 3, 21)
    assert parse_date("N/A") is None


def test_parse_time_handles_excel_day_fraction() -> None:
    assert _parse_time(0.5375) == "12:54"
    assert _parse_time("08:30") == "08:30"


def test_hazop_rec_no_comes_from_the_dotted_rec_no_column() -> None:
    # mart_pertamina.hazop.REC_NO holds the "1.1." style value from the "Rec. No." column.
    from src.repository.crud.hazop import HAZOP_MAPPER

    assert HAZOP_MAPPER["Rec. No."] == "rec_no"
    assert "REC. NO." not in HAZOP_MAPPER
