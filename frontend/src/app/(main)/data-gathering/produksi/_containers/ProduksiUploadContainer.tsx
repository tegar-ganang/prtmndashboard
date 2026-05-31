"use client";

import React, { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { useDropzone } from "react-dropzone";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
	Upload,
	FileSpreadsheet,
	X,
	CheckCircle2,
	AlertCircle,
	History,
	Loader2,
	BarChart3,
	CalendarDays,
	Target,
	Zap,
} from "lucide-react";
import Select from "react-select";
import axiosInstance from "@/services/api/main/interceptor";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

// ── Types ────────────────────────────────────────────────────────────────────

interface PreviewRow {
	tanggal: string | null;
	pupo_sot_real: number | null;
	op_real: number | null;
	donggi_prod: number | null;
	matindok_prod: number | null;
	safe_man_hours_actl: number | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTH_OPTIONS = [
	{ value: 1, label: "Januari" }, { value: 2, label: "Februari" },
	{ value: 3, label: "Maret" }, { value: 4, label: "April" },
	{ value: 5, label: "Mei" }, { value: 6, label: "Juni" },
	{ value: 7, label: "Juli" }, { value: 8, label: "Agustus" },
	{ value: 9, label: "September" }, { value: 10, label: "Oktober" },
	{ value: 11, label: "November" }, { value: 12, label: "Desember" },
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => {
	const y = currentYear - 2 + i;
	return { value: y, label: String(y) };
});

const SELECT_STYLES = {
	control: (base: any) => ({
		...base,
		borderColor: "#e5e7eb",
		borderRadius: "0.5rem",
		minHeight: "38px",
		fontSize: "13px",
	}),
	menu: (base: any) => ({ ...base, zIndex: 50, fontSize: "13px" }),
};

// ── Helper: parse Excel client-side for preview ───────────────────────────────

function parseExcelPreview(buffer: ArrayBuffer): {
	preview: PreviewRow[];
	targetRows: { month: number; dmf: number }[];
	totalRows: number;
} {
	const wb = XLSX.read(buffer, { type: "array", cellDates: true });
	const sheet1 = wb.Sheets[wb.SheetNames[0]];
	const sheet2 = wb.Sheets[wb.SheetNames[1]];

	// Parse Sheet2 target
	const s2Raw = XLSX.utils.sheet_to_json<any[]>(sheet2, { header: 1 });
	const targetRows: { month: number; dmf: number }[] = [];
	for (let i = 2; i < s2Raw.length; i++) {
		const row = s2Raw[i];
		const bulan = row[0];
		const dmf = row[1];
		if (bulan == null || dmf == null) continue;
		const d = bulan instanceof Date ? bulan : new Date(bulan);
		if (!isNaN(d.getTime())) {
			targetRows.push({ month: d.getMonth() + 1, dmf: Number(dmf) });
		}
	}

	// Parse Sheet1 — raw rows (header at row 0+1, data from row 2)
	const s1Raw = XLSX.utils.sheet_to_json<any[]>(sheet1, { header: 1 });
	const dataRows = s1Raw.slice(2);
	const totalRows = dataRows.filter((r) => r[0] != null).length;

	// Column indices (0-based) based on known template structure
	// Col 0: Tanggal, Col 2: PUPO/SOT Real, Col 6: Op Real,
	// Col 9: Donggi Prod, Col 16: Matindok Prod, Col 26: Safe Man Hours ACTL
	const COL_TANGGAL = 0;
	const COL_PUPO_SOT_REAL = 2;
	const COL_OP_REAL = 6;
	const COL_DONGGI_PROD = 9;
	const COL_MATINDOK_PROD = 16;
	const COL_SAFE_MAN_HOURS_ACTL = 26;

	const preview: PreviewRow[] = dataRows
		.filter((r) => r[COL_TANGGAL] != null)
		.slice(0, 31) // max 31 rows (1 month)
		.map((r) => {
			let tgl: string | null = null;
			const rawDate = r[COL_TANGGAL];
			if (rawDate instanceof Date) {
				tgl = format(rawDate, "dd MMM yyyy", { locale: localeId });
			} else if (rawDate != null) {
				try {
					tgl = format(new Date(rawDate), "dd MMM yyyy", { locale: localeId });
				} catch {
					tgl = String(rawDate);
				}
			}
			const safeNum = (v: any) => (v != null && !isNaN(Number(v)) ? Number(v) : null);
			return {
				tanggal: tgl,
				pupo_sot_real: safeNum(r[COL_PUPO_SOT_REAL]),
				op_real: safeNum(r[COL_OP_REAL]),
				donggi_prod: safeNum(r[COL_DONGGI_PROD]),
				matindok_prod: safeNum(r[COL_MATINDOK_PROD]),
				safe_man_hours_actl: safeNum(r[COL_SAFE_MAN_HOURS_ACTL]),
			};
		});

	return { preview, targetRows, totalRows };
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ProduksiUploadContainer() {
	const router = useRouter();

	// Form state
	const [selectedYear, setSelectedYear] = useState(YEAR_OPTIONS.find(o => o.value === currentYear) ?? YEAR_OPTIONS[2]);
	const [selectedMonth, setSelectedMonth] = useState(MONTH_OPTIONS[new Date().getMonth()]);
	const [mode, setMode] = useState<"append" | "overwrite">("append");

	// File + preview state
	const [file, setFile] = useState<File | null>(null);
	const [preview, setPreview] = useState<PreviewRow[]>([]);
	const [targetRows, setTargetRows] = useState<{ month: number; dmf: number }[]>([]);
	const [totalRows, setTotalRows] = useState(0);
	const [parsing, setParsing] = useState(false);

	// Period exists check
	const [periodExists, setPeriodExists] = useState<boolean | null>(null);
	const [checkingPeriod, setCheckingPeriod] = useState(false);

	// Upload mutation
	const uploadMutation = useMutation({
		mutationFn: async () => {
			if (!file) throw new Error("No file selected");
			const formData = new FormData();
			formData.append("file", file);
			formData.append("reporting_year", String(selectedYear.value));
			formData.append("reporting_month", String(selectedMonth.value));
			formData.append("mode", mode);

			const { data } = await axiosInstance.post(
				MAIN_ENDPOINT.Produksi.Upload,
				formData,
				{ headers: { "Content-Type": "multipart/form-data" } }
			);

			if (!data.success) throw new Error(data.err ?? "Upload gagal");
			return data.data as { upload_batch_id: string };
		},
		onSuccess: (data) => {
			toast.success(`${totalRows} baris berhasil diupload!`);
			setFile(null);
			setPreview([]);
			setTargetRows([]);
			setTotalRows(0);
			setPeriodExists(null);
			router.push(`/monitoring/produksi?batch_id=${data.upload_batch_id}`);
		},
		onError: (err: any) => {
			toast.error(err?.response?.data?.detail ?? err?.message ?? "Upload gagal");
		},
	});

	// Check period existence
	const checkPeriod = useCallback(async (year: number, month: number) => {
		setCheckingPeriod(true);
		try {
			const { data } = await axiosInstance.get(MAIN_ENDPOINT.Produksi.CheckPeriod, {
				params: { year, month },
			});
			setPeriodExists(data?.data?.exists ?? false);
		} catch {
			setPeriodExists(null);
		} finally {
			setCheckingPeriod(false);
		}
	}, []);

	// File processing
	const processFile = useCallback((f: File) => {
		setParsing(true);
		setFile(f);
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const buf = e.target?.result as ArrayBuffer;
				const { preview: p, targetRows: t, totalRows: total } = parseExcelPreview(buf);
				setPreview(p);
				setTargetRows(t);
				setTotalRows(total);
				toast.success(`File dibaca: ${total} baris data harian ditemukan`);
			} catch (err) {
				toast.error("Gagal membaca file Excel. Pastikan format sesuai template.");
				setFile(null);
			} finally {
				setParsing(false);
			}
		};
		reader.readAsArrayBuffer(f);
	}, []);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop: (files) => {
			if (files.length > 0) processFile(files[0]);
		},
		accept: {
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
			"application/vnd.ms-excel": [".xls"],
		},
		multiple: false,
		disabled: uploadMutation.isPending,
	});

	const handleSubmit = async () => {
		if (!file) return;

		// Check period first if not already checked
		if (periodExists === null) {
			await checkPeriod(selectedYear.value, selectedMonth.value);
		}

		// If overwrite not selected and period exists, prompt
		if (periodExists && mode === "append") {
			toast.error(
				"Data untuk periode ini sudah ada. Ganti mode ke 'Overwrite' untuk menimpa.",
				{ duration: 5000 }
			);
			return;
		}

		uploadMutation.mutate();
	};

	const handleYearMonthChange = (year: number, month: number) => {
		setPeriodExists(null);
		checkPeriod(year, month);
	};

	// Target lookup helper
	const getTarget = (month: number) =>
		targetRows.find((t) => t.month === month)?.dmf ?? null;

	const currentTarget = getTarget(selectedMonth.value);

	// ── Render ────────────────────────────────────────────────────────────────

	return (
		<div className="flex flex-col gap-6 p-6 pb-24 w-full min-w-0">
			{/* Header */}
			<div className="flex items-start justify-between">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Upload Produksi Harian</h1>
					<p className="text-sm text-gray-500 mt-0.5">
						Upload file Excel dengan 2 sheet: Sheet1 (Data Harian) + Sheet2 (Target Bulanan)
					</p>
				</div>
				<button
					onClick={() => router.push("/monitoring/produksi")}
					className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
				>
					<History className="w-4 h-4" />
					Lihat Monitoring
				</button>
			</div>

			{/* Main layout */}
			<div className="grid grid-cols-12 gap-5 items-start">
				{/* Sidebar: Form controls */}
				<div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
					<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-4">
						<h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
							Konfigurasi Periode
						</h2>

						{/* Year */}
						<div>
							<label className="block text-xs font-semibold text-gray-600 mb-1.5">
								Tahun
							</label>
							<Select
								options={YEAR_OPTIONS}
								value={selectedYear}
								onChange={(v) => {
									if (v) {
										setSelectedYear(v);
										handleYearMonthChange(v.value, selectedMonth.value);
									}
								}}
								styles={SELECT_STYLES}
								isDisabled={uploadMutation.isPending}
							/>
						</div>

						{/* Month */}
						<div>
							<label className="block text-xs font-semibold text-gray-600 mb-1.5">
								Bulan Laporan
							</label>
							<Select
								options={MONTH_OPTIONS}
								value={selectedMonth}
								onChange={(v) => {
									if (v) {
										setSelectedMonth(v);
										handleYearMonthChange(selectedYear.value, v.value);
									}
								}}
								styles={SELECT_STYLES}
								isDisabled={uploadMutation.isPending}
							/>
						</div>

						{/* Mode */}
						<div>
							<label className="block text-xs font-semibold text-gray-600 mb-2">
								Mode Upload
							</label>
							<div className="flex gap-2">
								{(["append", "overwrite"] as const).map((m) => (
									<button
										key={m}
										onClick={() => setMode(m)}
										disabled={uploadMutation.isPending}
										className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
											mode === m
												? m === "overwrite"
													? "bg-red-50 border-red-300 text-red-700"
													: "bg-blue-50 border-blue-300 text-blue-700"
												: "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
										}`}
									>
										{m === "append" ? "Append" : "Overwrite"}
									</button>
								))}
							</div>
							<p className="text-[10px] text-gray-400 mt-1.5">
								{mode === "overwrite"
									? "⚠️ Data lama untuk periode ini akan dihapus."
									: "Data baru ditambahkan ke data yang sudah ada."}
							</p>
						</div>

						{/* Period status indicator */}
						{checkingPeriod && (
							<div className="flex items-center gap-2 text-xs text-gray-500">
								<Loader2 className="w-3.5 h-3.5 animate-spin" />
								Mengecek periode…
							</div>
						)}
						{!checkingPeriod && periodExists === true && (
							<div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
								<AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
								<p className="text-xs text-amber-700 font-medium">
									Data untuk {selectedMonth.label} {selectedYear.value} sudah ada.
									Gunakan mode <strong>Overwrite</strong> untuk menimpa.
								</p>
							</div>
						)}
						{!checkingPeriod && periodExists === false && (
							<div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-2.5">
								<CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
								<p className="text-xs text-green-700 font-medium">Periode belum ada data.</p>
							</div>
						)}
					</div>

					{/* Target preview from Sheet2 */}
					{targetRows.length > 0 && (
						<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
							<h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
								<Target className="w-3.5 h-3.5" />
								Target Bulanan (Sheet 2)
							</h2>
							<div className="space-y-1 max-h-60 overflow-y-auto pr-1">
								{targetRows.map((t) => {
									const mo = MONTH_OPTIONS.find((m) => m.value === t.month);
									const isActive = t.month === selectedMonth.value;
									return (
										<div
											key={t.month}
											className={`flex justify-between items-center px-2.5 py-1.5 rounded-lg text-xs ${
												isActive
													? "bg-emerald-50 border border-emerald-200 font-semibold text-emerald-800"
													: "text-gray-600"
											}`}
										>
											<span>{mo?.label ?? `Bulan ${t.month}`}</span>
											<span className="font-mono font-bold">{t.dmf.toFixed(2)}</span>
										</div>
									);
								})}
							</div>
							{currentTarget !== null && (
								<div className="mt-3 pt-3 border-t border-gray-100">
									<p className="text-[10px] text-gray-400 mb-0.5">
										Target {selectedMonth.label} {selectedYear.value}
									</p>
									<p className="text-lg font-bold text-emerald-700">
										{currentTarget.toFixed(2)}{" "}
										<span className="text-xs font-normal text-gray-400">MMSCFD</span>
									</p>
								</div>
							)}
						</div>
					)}
				</div>

				{/* Main area: Dropzone + Preview */}
				<div className="col-span-12 lg:col-span-9 flex flex-col gap-5">
					{/* Dropzone */}
					<div
						{...getRootProps()}
						className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer
							${isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/30"}
							${file ? "py-6" : "py-14"}
						`}
					>
						<input {...getInputProps()} />
						{parsing ? (
							<div className="flex flex-col items-center gap-3">
								<Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
								<p className="text-sm font-medium text-blue-600">Memproses file Excel…</p>
							</div>
						) : file ? (
							<div className="flex items-center justify-between px-6">
								<div className="flex items-center gap-3">
									<div className="p-2.5 bg-green-50 rounded-xl border border-green-200">
										<FileSpreadsheet className="w-6 h-6 text-green-600" />
									</div>
									<div>
										<p className="text-sm font-semibold text-gray-900">{file.name}</p>
										<p className="text-xs text-gray-500">
											{(file.size / 1024).toFixed(1)} KB · {totalRows} baris data harian ditemukan
										</p>
									</div>
								</div>
								<button
									onClick={(e) => {
										e.stopPropagation();
										setFile(null);
										setPreview([]);
										setTargetRows([]);
										setTotalRows(0);
									}}
									className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
								>
									<X className="w-4 h-4" />
								</button>
							</div>
						) : (
							<div className="flex flex-col items-center gap-3 text-center px-4">
								<div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
									<FileSpreadsheet className="w-10 h-10 text-blue-500" />
								</div>
								<div>
									<p className="text-base font-semibold text-gray-700">
										{isDragActive ? "Lepaskan file di sini…" : "Drag & drop file Excel"}
									</p>
									<p className="text-xs text-gray-400 mt-1">
										atau klik untuk memilih file (.xlsx)
									</p>
								</div>
								<div className="flex gap-2 mt-1">
									<span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-100">
										Sheet 1: Data Harian
									</span>
									<span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-100">
										Sheet 2: Target Bulanan
									</span>
								</div>
							</div>
						)}
					</div>

					{/* Stats bar */}
					{preview.length > 0 && (
						<div className="grid grid-cols-3 gap-3">
							{[
								{ label: "Total Baris Harian", value: totalRows, icon: CalendarDays, color: "blue" },
								{
									label: "Target DMF Terpetakan",
									value: `${targetRows.length}/12 bulan`,
									icon: Target,
									color: "emerald",
								},
								{
									label: "Target Periode Ini",
									value: currentTarget !== null ? `${currentTarget.toFixed(2)} MMSCFD` : "—",
									icon: BarChart3,
									color: "indigo",
								},
							].map(({ label, value, icon: Icon, color }) => (
								<div
									key={label}
									className={`bg-white rounded-xl border border-gray-200 shadow-sm p-3.5 flex items-center gap-3`}
								>
									<div className={`p-2 rounded-lg bg-${color}-50 border border-${color}-100`}>
										<Icon className={`w-4 h-4 text-${color}-600`} />
									</div>
									<div>
										<p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
										<p className={`text-sm font-bold text-${color}-700`}>{value}</p>
									</div>
								</div>
							))}
						</div>
					)}

					{/* Preview table */}
					{preview.length > 0 && (
						<div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
							<div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
								<div>
									<h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
										<Zap className="w-4 h-4 text-blue-500" />
										Preview Data Harian (Sheet 1)
									</h3>
									<p className="text-xs text-gray-400 mt-0.5">
										Menampilkan {preview.length} dari {totalRows} baris · kolom utama saja
									</p>
								</div>
								{/* Submit button */}
								<button
									onClick={handleSubmit}
									disabled={!file || uploadMutation.isPending || parsing}
									className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
								>
									{uploadMutation.isPending ? (
										<>
											<Loader2 className="w-4 h-4 animate-spin" />
											Mengupload…
										</>
									) : (
										<>
											<Upload className="w-4 h-4" />
											Upload ke Database
										</>
									)}
								</button>
							</div>

							<div className="overflow-x-auto">
								<table className="w-full text-left border-collapse">
									<thead className="bg-gray-50 border-b border-gray-200">
										<tr>
											{[
												"Tanggal",
												"PUPO/SOT Real (BOPD)",
												"Op Real (BOPD)",
												"Donggi Prod (MMSCFD)",
												"Matindok Prod (MMSCFD)",
												"Safe Man Hours",
												"Target DMF",
											].map((h) => (
												<th
													key={h}
													className="px-3 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap"
												>
													{h}
												</th>
											))}
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-50">
										{preview.map((row, idx) => {
											// Get target for this row's month
											let rowTargetDmf: number | null = null;
											if (row.tanggal) {
												const monthMatch = row.tanggal.match(/\w+ \d{4}$/);
												// simple: use selected month's target from Sheet2
												rowTargetDmf = currentTarget;
											}
											return (
												<tr key={idx} className="hover:bg-blue-50/30 transition-colors">
													<td className="px-3 py-2.5 text-xs font-mono text-gray-700 whitespace-nowrap">
														{row.tanggal ?? "—"}
													</td>
													<td className="px-3 py-2.5 text-xs text-gray-600">
														{row.pupo_sot_real != null ? row.pupo_sot_real.toFixed(3) : "—"}
													</td>
													<td className="px-3 py-2.5 text-xs text-gray-600">
														{row.op_real != null ? row.op_real.toFixed(3) : "—"}
													</td>
													<td className="px-3 py-2.5 text-xs font-semibold text-blue-700">
														{row.donggi_prod != null ? row.donggi_prod.toFixed(2) : "—"}
													</td>
													<td className="px-3 py-2.5 text-xs font-semibold text-indigo-700">
														{row.matindok_prod != null ? row.matindok_prod.toFixed(2) : "—"}
													</td>
													<td className="px-3 py-2.5 text-xs text-gray-500">
														{row.safe_man_hours_actl != null
															? row.safe_man_hours_actl.toLocaleString()
															: "—"}
													</td>
													<td className="px-3 py-2.5 text-xs font-bold text-emerald-700">
														{rowTargetDmf != null ? rowTargetDmf.toFixed(2) : "—"}
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>

							{totalRows > preview.length && (
								<div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 text-center">
									+{totalRows - preview.length} baris lainnya akan ikut diupload
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
