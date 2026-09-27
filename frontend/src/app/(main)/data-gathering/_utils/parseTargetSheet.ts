import * as XLSX from "xlsx";

export type TargetSheetRow = {
	date: Date;
	dmf: number;
	gasWpb: number | null;
	kondensatRkap: number | null;
	kondensatWpb: number | null;
};

const normalize = (h: unknown) => String(h ?? "").toUpperCase().split(/\s+/).filter(Boolean).join(" ");

/**
 * Parse Sheet 2 (Target Bulanan) of the Produksi template for the client-side preview.
 * Columns are matched by header name on row 2 (not by position), same as the backend parser.
 * "KONDENSAT" alone is the old layout and maps to the RKAP column. Rows without a month or DMF are skipped.
 */
export function parseTargetSheet(sheet: XLSX.WorkSheet): TargetSheetRow[] {
	const raw = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
	const header = (raw[1] ?? []).map(normalize);
	const colOf = (...names: string[]) => header.findIndex((h) => names.includes(h));
	const cDmf = colOf("DMF");
	const cGasWpb = colOf("GAS WP&B");
	const cKondensatRkap = colOf("KONDENSAT RKAP", "KONDENSAT");
	const cKondensatWpb = colOf("KONDENSAT WP&B");
	const num = (row: any[], col: number) =>
		col >= 0 && row[col] != null && !isNaN(Number(row[col])) ? Number(row[col]) : null;

	const rows: TargetSheetRow[] = [];
	for (const row of raw.slice(2)) {
		if (!row || cDmf < 0 || row[0] == null || row[cDmf] == null) continue;
		const date = row[0] instanceof Date ? row[0] : new Date(row[0]);
		if (isNaN(date.getTime())) continue;
		rows.push({
			date,
			dmf: Number(row[cDmf]),
			gasWpb: num(row, cGasWpb),
			kondensatRkap: num(row, cKondensatRkap),
			kondensatWpb: num(row, cKondensatWpb),
		});
	}
	return rows;
}
