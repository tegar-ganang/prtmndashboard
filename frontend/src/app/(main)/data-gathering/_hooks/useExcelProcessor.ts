/**
 * useExcelProcessor — custom hook that reads an uploaded Excel file,
 * validates headers against the expected schema for the selected doc type,
 * maps column values, and validates required fields per row.
 */

"use client";

import { useCallback } from "react";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { DOC_TYPE_CONFIG, type DocTypeValue } from "../_constants/dataGathering.constants";
import type { ExcelRow } from "../_types";

interface UseExcelProcessorOptions {
	docType: DocTypeValue;
	onProcessed: (rows: ExcelRow[]) => void;
	onProcessing: (processing: boolean) => void;
}

const normalize = (s: string) => s.toUpperCase().replace(/\s+/g, " ").trim();

const ZONA_PSE_LIST_COLUMNS = [
	{ key: "NO", index: 0 },
	{ key: "ZONA", index: 1 },
	{ key: "FIELD / AREA", index: 2 },
	{ key: "LOKASI", index: 3 },
	{ key: "UNIT / DETAIL ", index: 4 },
	{ key: "SHORT DESCRIPTION", index: 5 },
	{ key: "EVENT ISSUE CATEGORY", index: 6 },
	{ key: "ACTIVITY", index: 7 },
	{ key: "TYPE LOCATION", index: 8 },
	{ key: "DATE START (DD/MM/YYYY)", index: 9 },
	{ key: "TIME START @LOCAL\n (HH:MM)", index: 10 },
	{ key: "BARRIER PREVENT?", index: 11 },
	{ key: "BARRIER MITIGATE?", index: 12 },
	{ key: "LOPC RELEASED?", index: 13 },
	{ key: "LOPC DURATION (hour)", index: 14 },
	{ key: "LOPC FLAMMABLE GAS (kg)", index: 15 },
	{ key: " LOPC GAS \nIN ANY ONE HOUR PERIODE (kg) ", index: 16 },
	{ key: "LIQUID HC\n(TYPE MATERIAL)", index: 17 },
	{ key: "LOPC HC LIQUID (barrel)", index: 18 },
	{ key: " LOPC HC LIQUID \nIN ANY ONE HOUR PERIODE (kg) ", index: 19 },
	{ key: "TOXIC \n(TYPE MATERIAL)", index: 20 },
	{ key: "LOPC TOXIC (kg)", index: 21 },
	{ key: " LOPC TOXIC \nIN ANY ONE HOUR PERIODE (kg) ", index: 22 },
	{ key: "OTHER \n(TYPE MATERIAL)", index: 23 },
	{ key: "LOPC OTHER (kg)", index: 24 },
	{ key: " LOPC OTHER \nIN ANY ONE HOUR PERIODE (kg) ", index: 25 },
	{ key: "INJURED WORKER?", index: 26 },
	{ key: "AFFECT 3rd PARTY?", index: 27 },
	{ key: "NUMBER INJURED PERSON?", index: 28 },
	{ key: "NUMBER FATALITY?", index: 29 },
	{ key: "FIRE / EXPLOSION?", index: 30 },
	{ key: " DAMAGE BY FIRE / EXPLOSION (US$) ", index: 31 },
	{ key: "RELIEF DEVICE / UPSET EMISSION?", index: 32 },
	{ key: "EFFECT TO DISCHARGE POINT OF RELIEF DEVICE / UPSET EMISSION? ", index: 33 },
	{ key: "PSE TIER", index: 34 },
	{ key: "CAUSAL_1_DESC", index: 35 },
	{ key: "CAUSAL_1_CATEGORY", index: 36 },
	{ key: "CAUSAL_1_SUB_CATEGORY", index: 37 },
	{ key: "CAUSAL_2_DESC", index: 38 },
	{ key: "CAUSAL_2_CATEGORY", index: 39 },
	{ key: "CAUSAL_2_SUB_CATEGORY", index: 40 },
	{ key: "CAUSAL_3_DESC", index: 41 },
	{ key: "CAUSAL_3_CATEGORY", index: 42 },
	{ key: "CAUSAL_3_SUB_CATEGORY", index: 43 },
	{ key: "BARRIER_1_DESC", index: 44 },
	{ key: "BARRIER_1_CATEGORY", index: 45 },
	{ key: "BARRIER_1_SUB_CATEGORY", index: 46 },
	{ key: "BARRIER_2_DESC", index: 47 },
	{ key: "BARRIER_2_CATEGORY", index: 48 },
	{ key: "BARRIER_2_SUB_CATEGORY", index: 49 },
	{ key: "BARRIER_3_DESC", index: 50 },
	{ key: "BARRIER_3_CATEGORY", index: 51 },
	{ key: "BARRIER_3_SUB_CATEGORY", index: 52 },
	{ key: "REMARKS", index: 53 },
];

const MIT_STATUSES = ["ON PROGRESS", "CLOSED"];
const MIT_REQUIRED = [
	"No Registration - Jenis MIT", "No Registration - Kategori", "No Registration - Tahun", "No Registration - No",
	"MIT Title / Asset", "MIT Status",
];
const RISK_TRIPLES = [
	["Current Risk - Likelihood", "Current Risk - Severity", "Current Risk - Risk"],
	["Target Risk (After implemented Recommendation) - Likelihood", "Target Risk (After implemented Recommendation) - Severity", "Risk"],
];

export function validateMitRow(obj: ExcelRow): string[] {
	const errors: string[] = [];
	const title = obj["MIT Title / Asset"];
	if (title != null && String(title).trim() === "0") errors.push("MIT Title / Asset tidak boleh 0");

	const status = obj["MIT Status"];
	if (status != null && !MIT_STATUSES.includes(String(status).trim().toUpperCase())) {
		errors.push(`MIT Status harus ${MIT_STATUSES.join(" / ")}`);
	}

	// NONMIT rows legitimately have "N/A"; real MIT rows need an actual date.
	const jenis = String(obj["No Registration - Jenis MIT"] ?? "").trim().toUpperCase();
	if (jenis === "MIT" && !/^\d{4}-\d{2}-\d{2}$/.test(String(obj["MIT Declaration Date"] ?? ""))) {
		errors.push("MIT Declaration Date harus tanggal untuk Jenis MIT");
	}

	for (const [l, s, r] of RISK_TRIPLES) {
		const [lv, sv, rv] = [obj[l], obj[s], obj[r]].map(Number);
		if (obj[l] != null && obj[s] != null && obj[r] != null && [lv, sv, rv].every(Number.isFinite) && lv * sv !== rv) {
			errors.push(`${r} harus ${lv} × ${sv} = ${lv * sv} (tertulis ${rv})`);
		}
	}
	return errors;
}

// Formats the backend's parse_date accepts: yyyy-mm-dd, dd/mm/yyyy, bare year, Excel serial number.
const PARSEABLE_DATE = /^(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|\d{4})$/;
const EMPTY_DATE_MARKERS = new Set(["N/A", "NA", "-", "—"]);

function validateRow(obj: ExcelRow, docType: DocTypeValue): string[] {
	const errors: string[] = [];
	const requiredFields = docType === "MIT" ? MIT_REQUIRED : DOC_TYPE_CONFIG[docType].requiredFields;
	requiredFields.forEach((field) => {
		if (obj[field] == null || String(obj[field]).trim() === "") errors.push(`${field} wajib diisi`);
	});
	for (const field of DOC_TYPE_CONFIG[docType].dateFields ?? []) {
		const v = obj[field];
		if (v == null || typeof v === "number") continue;
		const s = String(v).trim();
		if (!PARSEABLE_DATE.test(s) && !EMPTY_DATE_MARKERS.has(s.toUpperCase())) {
			errors.push(`${field} harus tanggal (tertulis "${s.slice(0, 40)}")`);
		}
	}
	if (docType === "MIT") errors.push(...validateMitRow(obj));
	return errors;
}

/** Pure parse + validate of sheet rows; the hook only adds file reading and toasts. */
export function parseRows(rawData: any[][], docType: DocTypeValue): { missing: string[]; rows: ExcelRow[] } {
	const expectedHeaders = DOC_TYPE_CONFIG[docType].expectedHeaders;
	const toHeaders = (r: number) => ((rawData[r] as any[]) || []).map((h) => (h ? String(h).trim() : ""));

	// Header row may sit below title/metadata rows: take the first of the top 10 rows that has every expected header.
	let headerRowIdx = 0;
	for (let r = 0; r < Math.min(10, rawData.length); r++) {
		const found = new Set(toHeaders(r).map(normalize));
		if (expectedHeaders.every((h) => found.has(normalize(h)))) {
			headerRowIdx = r;
			break;
		}
	}
	const rawHeaders = toHeaders(headerRowIdx);
	const normalizedHeaders = rawHeaders.map(normalize);
	const missing = expectedHeaders.filter((h) => !normalizedHeaders.includes(normalize(h)));
	if (missing.length) return { missing, rows: [] };

	const rows = rawData.slice(headerRowIdx + 1).filter((r) => r.some((c: any) => c != null && c !== ""));

	const parsed: ExcelRow[] = rows.map((row, i) => {
		const obj: ExcelRow = { _index: i + 1, _isValid: true, _errors: [] };

		if (docType === "ZONA_PSE_LIST") {
			// Use index-based mapping
			ZONA_PSE_LIST_COLUMNS.forEach(({ key, index }) => {
				let v = row[index];
				if (v instanceof Date) {
					if (key === "TIME START @LOCAL\n (HH:MM)") {
						const hrs = String(v.getHours()).padStart(2, '0');
						const mins = String(v.getMinutes()).padStart(2, '0');
						v = `${hrs}:${mins}`;
					} else {
						v = format(v, "yyyy-MM-dd");
					}
				}
				obj[key] = v != null && v !== "" ? v : null;
			});
		} else {
			expectedHeaders.forEach((h) => {
				// Exact match first: HAZOP has distinct "Rec. No." and "REC. NO." columns that only differ by case.
				const exact = rawHeaders.indexOf(h.trim());
				const ci = exact !== -1 ? exact : normalizedHeaders.indexOf(normalize(h));
				if (ci === -1) { obj[h] = null; return; }
				let v = row[ci];
				// Local format, not toISOString(): SheetJS Dates are local midnight, UTC would shift them a day back in WIB.
				if (v instanceof Date) v = format(v, "yyyy-MM-dd");
				obj[h] = v != null && v !== "" ? v : null;
			});
		}

		const errors = validateRow(obj, docType);
		obj._isValid = errors.length === 0;
		obj._errors = errors;
		return obj;
	});

	return { missing: [], rows: parsed };
}

export function useExcelProcessor({ docType, onProcessed, onProcessing }: UseExcelProcessorOptions) {
	const processExcel = useCallback(
		(file: File) => {
			onProcessing(true);
			const reader = new FileReader();

			reader.onload = (e) => {
				try {
					const wb = XLSX.read(e.target?.result, { type: "array", cellDates: true });
					const rawData = XLSX.utils.sheet_to_json<any[]>(wb.Sheets[wb.SheetNames[0]], { header: 1 });

					if (rawData.length <= 1) {
						toast.error("File kosong.");
						return;
					}

					const { missing, rows: parsed } = parseRows(rawData, docType);
					if (missing.length) {
						toast.error(
							`Kolom tidak sesuai template!\nHilang: "${missing.slice(0, 2).join('", "')}"…`,
							{ duration: 6000 }
						);
						return;
					}

					onProcessed(parsed);
					toast.success(`${parsed.length} baris berhasil diproses.`);
				} catch (err) {
					console.error("Error processing Excel:", err);
					toast.error("Gagal membaca file Excel.");
				} finally {
					onProcessing(false);
				}
			};

			reader.readAsArrayBuffer(file);
		},
		[docType, onProcessed, onProcessing]
	);

	return { processExcel };
}
