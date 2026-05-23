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

					const rawHeaders = (rawData[0] as any[]).map((h) => (h ? String(h).trim() : ""));
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

					// Build expected→actual header mapping (case-insensitive)
					const headerMap: Record<string, string> = {};
					expectedHeaders.forEach((expected) => {
						const idx = normalizedHeaders.indexOf(normalize(expected));
						if (idx !== -1) headerMap[expected] = rawHeaders[idx];
					});

					const rows = rawData.slice(1).filter((r) => r.some((c: any) => c != null && c !== ""));

					const parsed: ExcelRow[] = rows.map((row, i) => {
						const obj: ExcelRow = { _index: i + 1, _isValid: true, _errors: [] };

						expectedHeaders.forEach((h) => {
							const actualHeader = headerMap[h];
							const ci = rawHeaders.indexOf(actualHeader);
							if (ci === -1) { obj[h] = null; return; }
							let v = row[ci];
							if (v instanceof Date) v = v.toISOString().split("T")[0];
							obj[h] = v != null && v !== "" ? v : null;
						});

						const errors = validateRow(obj, docType);
						obj._isValid = errors.length === 0;
						obj._errors = errors;
						return obj;
					});

					onProcessed(parsed);
					toast.success(`${parsed.length} baris berhasil diproses.`);
				} catch {
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
