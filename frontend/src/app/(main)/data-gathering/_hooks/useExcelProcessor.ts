/**
 * useExcelProcessor — custom hook that reads an uploaded Excel file,
 * validates headers against the expected schema for the selected doc type,
 * maps column values, and validates required fields per row.
 */

"use client";

import { useCallback } from "react";
import * as XLSX from "xlsx";
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

function validateRow(obj: ExcelRow, docType: DocTypeValue): string[] {
	const errors: string[] = [];
	const requiredFields = DOC_TYPE_CONFIG[docType].requiredFields;
	requiredFields.forEach((field) => {
		if (!obj[field]) errors.push(`${field} wajib diisi`);
	});
	return errors;
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

					let headerRowIdx = 0;
					let rawHeaders = (rawData[0] as any[]).map((h) => (h ? String(h).trim() : ""));

					// Detect header row for ZONA_PSE_LIST (since it might have metadata row 1 and 2)
					if (docType === "ZONA_PSE_LIST") {
						for (let r = 0; r < Math.min(10, rawData.length); r++) {
							const rowCells = (rawData[r] as any[]) || [];
							const hasNo = rowCells.some(c => c && String(c).trim().toUpperCase() === "NO");
							const hasField = rowCells.some(c => c && String(c).trim().toUpperCase().includes("FIELD / AREA"));
							if (hasNo && hasField) {
								headerRowIdx = r;
								rawHeaders = rowCells.map((h) => (h ? String(h).trim() : ""));
								break;
							}
						}
					}

					const expectedHeaders = DOC_TYPE_CONFIG[docType].expectedHeaders;
					const normalizedHeaders = rawHeaders.map(normalize);
					const missing = expectedHeaders.filter((h) => !normalizedHeaders.includes(normalize(h)));

					if (missing.length) {
						toast.error(
							`Kolom tidak sesuai template!\nHilang: "${missing.slice(0, 2).join('", "')}"…`,
							{ duration: 6000 }
						);
						return;
					}

					const rows = rawData.slice(headerRowIdx + 1).filter((r) => r.some((c: any) => c != null && c !== ""));

					const parsed: ExcelRow[] = rows.map((row, i) => {
						const obj: ExcelRow = { _index: i + 1, _isValid: true, _errors: [] };

						if (docType === "ZONA_PSE_LIST") {
							// Use index-based mapping
							ZONA_PSE_LIST_COLUMNS.forEach(({ key, index }) => {
								let v = row[index];
								if (v instanceof Date) {
									if (key === "DATE START (DD/MM/YYYY)") {
										v = v.toISOString().split("T")[0];
									} else if (key === "TIME START @LOCAL\n (HH:MM)") {
										const hrs = String(v.getHours()).padStart(2, '0');
										const mins = String(v.getMinutes()).padStart(2, '0');
										v = `${hrs}:${mins}`;
									} else {
										v = v.toISOString().split("T")[0];
									}
								}
								obj[key] = v != null && v !== "" ? v : null;
							});
						} else {
							// Default header map
							const headerMap: Record<string, string> = {};
							expectedHeaders.forEach((expected) => {
								const idx = normalizedHeaders.indexOf(normalize(expected));
								if (idx !== -1) headerMap[expected] = rawHeaders[idx];
							});

							expectedHeaders.forEach((h) => {
								const actualHeader = headerMap[h];
								const ci = rawHeaders.indexOf(actualHeader);
								if (ci === -1) { obj[h] = null; return; }
								let v = row[ci];
								if (v instanceof Date) v = v.toISOString().split("T")[0];
								obj[h] = v != null && v !== "" ? v : null;
							});
						}

						const errors = validateRow(obj, docType);
						obj._isValid = errors.length === 0;
						obj._errors = errors;
						return obj;
					});

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
