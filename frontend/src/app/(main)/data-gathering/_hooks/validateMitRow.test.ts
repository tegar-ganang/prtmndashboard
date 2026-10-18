import { describe, expect, it } from "vitest";
import { parseRows, validateMitRow } from "./useExcelProcessor";
import { DOC_TYPE_CONFIG } from "../_constants/dataGathering.constants";

const base = {
	_index: 1, _isValid: true, _errors: [],
	"No Registration - Jenis MIT": "MIT",
	"MIT Declaration Date": "2025-03-21",
	"MIT Title / Asset": "DNG-MHR-005B",
	"Current Risk - Likelihood": 2, "Current Risk - Severity": 5, "Current Risk - Risk": 10,
	"Target Risk (After implemented Recommendation) - Likelihood": 0,
	"Target Risk (After implemented Recommendation) - Severity": 0,
	Risk: 0,
	"MIT Status": "ON PROGRESS",
};

describe("validateMitRow", () => {
	it("accepts a correct row, and NONMIT with N/A date", () => {
		expect(validateMitRow(base)).toEqual([]);
		expect(validateMitRow({ ...base, "No Registration - Jenis MIT": "NONMIT", "MIT Declaration Date": "N/A" })).toEqual([]);
	});

	it("flags title 0, bad status, non-date for MIT, and risk != L x S", () => {
		const errors = validateMitRow({
			...base,
			"MIT Title / Asset": 0,
			"MIT Status": "DONE",
			"MIT Declaration Date": "N/A",
			"Current Risk - Risk": 12,
		});
		expect(errors).toHaveLength(4);
	});
});

describe("parseRows", () => {
	const hazop = DOC_TYPE_CONFIG.HAZOP.expectedHeaders;
	const row = (over: Record<string, unknown>) => hazop.map((h) => (h in over ? over[h] : `x`));

	it("finds the header below a title row and keeps case-distinct columns apart", () => {
		const { missing, rows } = parseRows([["Judul laporan"], hazop, row({ "Rec. No.": "1.1.", "REC. NO.": 1, "TARGET DATE": "2026-01-31", "COMPLETION DATE": null })], "HAZOP");
		expect(missing).toEqual([]);
		expect(rows[0]["Rec. No."]).toBe("1.1.");
		expect(rows[0]["REC. NO."]).toBe(1);
		expect(rows[0]._errors).toEqual([]);
	});

	it("flags date cells the backend would silently drop", () => {
		const { rows } = parseRows([hazop, row({ "TARGET DATE": "2026-01-31", "COMPLETION DATE": "potential closed 2026" })], "HAZOP");
		expect(rows[0]._errors).toEqual(['COMPLETION DATE harus tanggal (tertulis "potential closed 2026")']);
	});
});
