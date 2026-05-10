"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect, Fragment } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import {
	Download, UploadCloud, AlertCircle, CheckCircle2, Save, X, Eye, Columns, ChevronDown, History
} from "lucide-react";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Dialog, Transition } from "@headlessui/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import toast from "react-hot-toast";
import Select from "react-select";
import { useRouter } from "next/navigation";

import Button from "@/components/button/Button";
import { useMonitoringBatchMutation } from "../_hooks/useMonitoringBatchMutation";
import { checkMonitoringPeriodExists } from "../_hooks/useMonitoringCheckPeriod";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const EXPECTED_HEADERS_MIT = [
	"Area", "No Registration - Lokasi", "No Registration - Jenis MIT",
	"No Registration - Kategori", "No Registration - Tahun", "No Registration - No",
	"MIT Declaration Date", "MIT Title / Asset", "Integrity Threats",
	"Possible Scenario", "Consequences", "Available Safeguard/Control",
	"Current Risk - Likelihood", "Current Risk - Severity", "Current Risk - Risk",
	"Rec. No.", "Recommendation / Action", "PIC", "Target Closing", "Remarks",
	"Target Risk (After implemented Recommendation) - Likelihood",
	"Target Risk (After implemented Recommendation) - Severity",
	"Risk", "MIT Status", "Evidence", "Closing Date",
];

const EXPECTED_HEADERS_HAZID = [
	"NO.", "NODE NO", "REC. NO.", "NODE", "GUIDEWORD", "HAZARD", "CONSEQUENCES", 
	"SAFEGUARD", "RECOMMENDATION", "LIKELIHOOD", "SEVERITY", "RISK", 
	"RESPONSIBILITY/PIC", "TYPE", "TARGET DATE", "RESPONSE / PROGRESS", 
	"CATEGORY", "SUB CATEGORY", "STATUS", "EVIDENCE", "COMPLETION DATE"
];

const EXPECTED_HEADERS_HAZOP = [
	"NO.", "Rec. No.", "NODE NO", "REC. NO.", "NODE", "DEVIATION", "POSSIBLE CAUSE", 
	"CONSEQUENCES", "SAFEGUARD", "RECOMMENDATION", "LIKELIHOOD", "SEVERITY", 
	"RISK", "RESPONSIBILITY/PIC", "TYPE", "TARGET DATE", "RESPONSE / PROGRESS", 
	"CATEGORY", "SUB CATEGORY", "STATUS", "EVIDENCE", "COMPLETION DATE", "SME"
];

const EXPECTED_HEADERS_LOPA = [
	"NO.", "FUNCTION NO.", "FUNCTION NAME", "FUNCTION DESCRIPTION", "FINAL ELEMENT", 
	"RECOMMENDATION", "RRF GAP VALUE", "RRF GAP TYPE", "RESPONSIBILITY/PIC", 
	"TARGET DATE", "REMINDER STATUS", "RESPONSE / PROGRESS", "STATUS", 
	"EVIDENCE", "COMPLETION DATE"
];

const GLANCE_COLS_MIT = [
	"Area", "No Registration - No", "MIT Title / Asset",
	"Current Risk - Risk", "MIT Status", "PIC", "Target Closing",
];

const GLANCE_COLS_HAZID = ["NODE", "HAZARD", "RISK", "STATUS", "RESPONSIBILITY/PIC"];
const GLANCE_COLS_HAZOP = ["NODE", "DEVIATION", "RISK", "STATUS", "RESPONSIBILITY/PIC"];
const GLANCE_COLS_LOPA = ["FUNCTION NAME", "FINAL ELEMENT", "RRF GAP VALUE", "STATUS", "RESPONSIBILITY/PIC"];

interface ExcelRow {
	_index: number; _isValid: boolean; _errors: string[];
	[key: string]: any;
}

const DRAWER_SECTIONS = [
	{ title: "Identitas & Registration", keys: ["Area", "No Registration - Lokasi", "No Registration - Jenis MIT", "No Registration - Kategori", "No Registration - Tahun", "No Registration - No"] },
	{ title: "Informasi MIT", keys: ["MIT Declaration Date", "MIT Title / Asset", "Integrity Threats", "Possible Scenario", "Consequences", "Available Safeguard/Control"] },
	{ title: "Current Risk", keys: ["Current Risk - Likelihood", "Current Risk - Severity", "Current Risk - Risk"] },
	{ title: "Rekomendasi", keys: ["Rec. No.", "Recommendation / Action", "PIC", "Target Closing", "Remarks"] },
	{ title: "Target Risk", keys: ["Target Risk (After implemented Recommendation) - Likelihood", "Target Risk (After implemented Recommendation) - Severity", "Risk"] },
	{ title: "Status & Evidence", keys: ["MIT Status", "Evidence", "Closing Date"] },
];

const LONG_KEYS = new Set(["MIT Title / Asset", "Integrity Threats", "Possible Scenario", "Consequences", "Available Safeguard/Control", "Recommendation / Action", "Remarks", "Evidence"]);

const DOCUMENT_OPTIONS = [
	{ value: "MIT", label: "Major Integrity Threat (MIT)" },
	{ value: "HAZID", label: "Hazard Identification (HAZID)" },
	{ value: "HAZOP", label: "Hazard and Operability Study (HAZOP)" },
	{ value: "LOPA", label: "Layer of Protection Analysis (LOPA)" },
];

const QUARTER_OPTIONS = [
	{ value: "Q1", label: "Q1" },
	{ value: "Q2", label: "Q2" },
	{ value: "Q3", label: "Q3" },
	{ value: "Q4", label: "Q4" },
];

const MONTH_OPTIONS = [
	{ value: "1", label: "Januari" },
	{ value: "2", label: "Februari" },
	{ value: "3", label: "Maret" },
	{ value: "4", label: "April" },
	{ value: "5", label: "Mei" },
	{ value: "6", label: "Juni" },
	{ value: "7", label: "Juli" },
	{ value: "8", label: "Agustus" },
	{ value: "9", label: "September" },
	{ value: "10", label: "Oktober" },
	{ value: "11", label: "November" },
	{ value: "12", label: "Desember" },
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => {
	const y = String(currentYear - 2 + i);
	return { value: y, label: y };
});

export default function DataGatheringContainer() {
	const [data, setData] = useState<ExcelRow[]>([]);
	const [processing, setProcessing] = useState(false);
	const [selectedRow, setSelectedRow] = useState<ExcelRow | null>(null);
	const [extraCols, setExtraCols] = useState<Record<string, boolean>>({});
	const [colMenuOpen, setColMenuOpen] = useState(false);
	const colMenuRef = useRef<HTMLDivElement>(null);

	const [docType, setDocType] = useState(DOCUMENT_OPTIONS[0]);
	const [quarter, setQuarter] = useState(QUARTER_OPTIONS[0]);
	const [month, setMonth] = useState(MONTH_OPTIONS[new Date().getMonth()]);
	const [year, setYear] = useState(YEAR_OPTIONS[2]); // current year

	const [confirmModalOpen, setConfirmModalOpen] = useState(false);
	const [isCheckingPeriod, setIsCheckingPeriod] = useState(false);

	const router = useRouter();

	const { mutate: uploadBatch, isPending: isUploading } = useMonitoringBatchMutation({ 
		docType: docType.value,
		onSuccess: (res) => {
			setData([]);
			router.push(`/monitoring/${docType.value.toLowerCase()}?batch_id=${res.upload_batch_id}`);
		}
	});

	// Close column menu on outside click
	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) setColMenuOpen(false);
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	const currentGlanceCols = docType.value === "MIT" ? GLANCE_COLS_MIT 
		: docType.value === "HAZID" ? GLANCE_COLS_HAZID
		: docType.value === "HAZOP" ? GLANCE_COLS_HAZOP
		: GLANCE_COLS_LOPA;

	const extraHeaders = useMemo(() =>
		data.length ? Object.keys(data[0]).filter(k => !k.startsWith("_") && !currentGlanceCols.includes(k)) : []
	, [data, currentGlanceCols]);

	const processExcel = useCallback((file: File) => {
		setProcessing(true);
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const wb = XLSX.read(e.target?.result, { type: "array", cellDates: true });
				const rawData = XLSX.utils.sheet_to_json<any[]>(wb.Sheets[wb.SheetNames[0]], { header: 1 });
				if (rawData.length <= 1) { toast.error("File kosong."); return; }

				const rawHeaders = (rawData[0] as any[]).map(h => h ? String(h).trim() : "");
				
				let expectedHeaders = EXPECTED_HEADERS_MIT;
				if (docType.value === "HAZID") expectedHeaders = EXPECTED_HEADERS_HAZID;
				if (docType.value === "HAZOP") expectedHeaders = EXPECTED_HEADERS_HAZOP;
				if (docType.value === "LOPA") expectedHeaders = EXPECTED_HEADERS_LOPA;

				// Case-insensitive header matching
				const normalize = (s: string) => s.toUpperCase().replace(/\s+/g, ' ').trim();
				const normalizedHeaders = rawHeaders.map(normalize);
				const missing = expectedHeaders.filter(h => !normalizedHeaders.includes(normalize(h)));

				if (missing.length) {
					toast.error(`Kolom tidak sesuai template!\nHilang: "${missing.slice(0, 2).join('", "')}..."`, { duration: 6000 });
					return;
				}

				// Create a mapping from expected header to the actual header in the file
				const headerMap: Record<string, string> = {};
				expectedHeaders.forEach(expected => {
					const normExpected = normalize(expected);
					const actualIndex = normalizedHeaders.indexOf(normExpected);
					if (actualIndex !== -1) {
						headerMap[expected] = rawHeaders[actualIndex];
					}
				});

				const rows = rawData.slice(1).filter(r => r.some((c: any) => c != null && c !== ""));
				const parsed: ExcelRow[] = rows.map((row, i) => {
					const errors: string[] = [];
					const obj: ExcelRow = { _index: i + 1, _isValid: true, _errors: [] };
					
					expectedHeaders.forEach(h => {
						const actualHeader = headerMap[h];
						const ci = rawHeaders.indexOf(actualHeader);
						if (ci === -1) {
							obj[h] = null;
							return;
						}
						let v = row[ci];
						if (v instanceof Date) v = v.toISOString().split("T")[0];
						obj[h] = (v != null && v !== "") ? v : null;
					});
					
					if (docType.value === "MIT") {
						if (!obj["MIT Title / Asset"]) errors.push("MIT Title / Asset wajib diisi");
						if (!obj["Area"]) errors.push("Area wajib diisi");
					} else if (docType.value === "HAZID" || docType.value === "HAZOP") {
						if (!obj["NODE"]) errors.push("NODE wajib diisi");
					} else if (docType.value === "LOPA") {
						if (!obj["FUNCTION NAME"]) errors.push("FUNCTION NAME wajib diisi");
					}
					
					obj._isValid = !errors.length;
					obj._errors = errors;
					return obj;
				});
				setData(parsed);
				setExtraCols({});
				toast.success(`${parsed.length} baris berhasil diproses.`);
			} catch { toast.error("Gagal membaca file Excel."); }
			finally { setProcessing(false); }
		};
		reader.readAsArrayBuffer(file);
	}, [docType]);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop: (files) => { if (files.length) processExcel(files[0]); },
		accept: {
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
			"application/vnd.ms-excel": [".xls"],
		},
		multiple: false,
	});

	const badge = (v: any, type: "risk" | "status") => {
		if (!v) return <span className="text-gray-300">—</span>;
		const s = String(v).toLowerCase();
		const cls = type === "risk"
			? s.includes("high") || s.includes("critical") ? "bg-red-100 text-red-700 border-red-200"
				: s.includes("medium") ? "bg-yellow-100 text-yellow-700 border-yellow-200"
				: s.includes("low") ? "bg-green-100 text-green-700 border-green-200"
				: "bg-gray-100 text-gray-600 border-gray-200"
			: s.includes("close") ? "bg-green-100 text-green-700 border-green-200"
				: s.includes("progress") || s.includes("going") ? "bg-blue-100 text-blue-700 border-blue-200"
				: "bg-gray-100 text-gray-600 border-gray-200";
		return <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap", cls)}>{v}</span>;
	};

	const ch = createColumnHelper<ExcelRow>();
	const staticCols = useMemo(() => {
		const actionCol = ch.display({
			id: "_act", header: "",
			cell: i => (
				<button onClick={e => { e.stopPropagation(); setSelectedRow(i.row.original); }}
					className="p-1 text-blue-600 hover:bg-blue-50 rounded border border-gray-200 bg-white shadow-sm">
					<Eye className="w-3.5 h-3.5" />
				</button>
			),
		});
		const validCol = ch.accessor("_isValid", {
			id: "_val", header: "Val.",
			cell: i => i.getValue()
				? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
				: <AlertCircle className="w-3.5 h-3.5 text-red-500" />,
		});
		const noCol = ch.accessor("_index", { id: "_no", header: "#", cell: i => <span className="text-gray-400 text-xs">{i.getValue()}</span> });

		const targetClosingCol = ch.accessor("Target Closing", {
			header: "Target Closing",
			cell: i => <span className="text-xs text-gray-600 whitespace-nowrap">{i.getValue() || "—"}</span>,
		});

		const currentGlanceColsMap = docType.value === "MIT" ? GLANCE_COLS_MIT 
			: docType.value === "HAZID" ? GLANCE_COLS_HAZID
			: docType.value === "HAZOP" ? GLANCE_COLS_HAZOP
			: GLANCE_COLS_LOPA;

		const baseCols = [actionCol, validCol, noCol];
		
		if (docType.value === "MIT") {
			baseCols.push(
				ch.accessor("Area", { header: "Area", cell: i => <div className="w-24 truncate text-xs font-medium text-gray-900" title={i.getValue() as string}>{i.getValue() ? String(i.getValue()) : "—"}</div> }),
				ch.accessor("No Registration - No", { header: "No. Reg", cell: i => <div className="w-28 truncate text-xs font-mono text-gray-600" title={i.getValue() as string}>{i.getValue() ? String(i.getValue()) : "—"}</div> }),
				ch.accessor("MIT Title / Asset", { header: "MIT Title / Asset", cell: i => <div className="w-52 truncate text-xs font-medium text-gray-900" title={i.getValue() as string}>{i.getValue() ? String(i.getValue()) : "—"}</div> }),
				ch.accessor("Current Risk - Risk", { header: "Current Risk", cell: i => badge(i.getValue(), "risk") }),
				ch.accessor("MIT Status", { header: "Status", cell: i => badge(i.getValue(), "status") }),
				ch.accessor("PIC", { header: "PIC", cell: i => <div className="w-24 truncate text-xs text-gray-600" title={i.getValue() as string}>{i.getValue() ? String(i.getValue()) : "—"}</div> }),
				targetClosingCol
			);
		} else {
			// For HAZID, HAZOP, LOPA dynamically show glance cols
			currentGlanceColsMap.forEach(col => {
				baseCols.push(ch.accessor(col, {
					header: col,
					cell: i => {
						const isRisk = col.includes("RISK");
						const isStatus = col.includes("STATUS");
						if (isRisk) return badge(i.getValue(), "risk");
						if (isStatus) return badge(i.getValue(), "status");
						return <div className="w-32 truncate text-xs font-medium text-gray-900" title={i.getValue() as string}>{i.getValue() ? String(i.getValue()) : "—"}</div>;
					}
				}));
			});
		}

		return baseCols;
	}, [ch, docType.value]);

	const dynCols = useMemo(() =>
		extraHeaders.filter(h => extraCols[h]).map(h =>
			ch.accessor(h, {
				header: h,
				cell: i => <div className="min-w-[140px] max-w-xs truncate text-xs text-gray-700 whitespace-nowrap" title={String(i.getValue() ?? "")}>{i.getValue() ?? "—"}</div>,
			})
		), [extraHeaders, extraCols, ch]);

	const columns = useMemo(() => [...staticCols, ...dynCols], [staticCols, dynCols]);
	const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

	const total = data.length, errors = data.filter(r => !r._isValid).length, valid = total - errors;
	const canSubmit = total > 0 && errors === 0;
	
	const handleProceedUpload = (mode: "append" | "overwrite") => {
		setConfirmModalOpen(false);
		const payload = data.map(({ _index, _isValid, _errors, ...rest }) => rest);
		
		const basePayload = {
			doc_type: docType.value,
			reporting_year: parseInt(year.value, 10),
			mode,
			items: payload 
		};

		if (docType.value === "MIT") {
			uploadBatch({ ...basePayload, reporting_quarter: parseInt(quarter.value.replace("Q", ""), 10) });
		} else {
			uploadBatch({ ...basePayload, reporting_month: parseInt(month.value, 10) });
		}
	};

	const handleSubmit = async () => { 
		if (!canSubmit) return; 
		setIsCheckingPeriod(true);
		try {
			const isMit = docType.value === "MIT";
			const periodValue = isMit ? parseInt(quarter.value.replace("Q", ""), 10) : parseInt(month.value, 10);
			const exists = await checkMonitoringPeriodExists(docType.value, parseInt(year.value, 10), periodValue);
			
			if (exists) {
				setConfirmModalOpen(true);
			} else {
				handleProceedUpload("append");
			}
		} catch (error) {
			console.error(error);
		} finally {
			setIsCheckingPeriod(false);
		}
	};

	return (
		<div className="flex flex-col gap-5 p-6 pb-20 w-full min-w-0">
			<div className="flex items-start justify-between">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Data Gathering</h1>
					<p className="text-sm text-gray-500 mt-0.5">Upload data MIT, HAZID, HAZOP, atau LOPA menggunakan template Excel yang disediakan.</p>
				</div>
				<Button variant="outline" onClick={() => router.push(`/monitoring/${docType.value.toLowerCase()}/history`)} className="flex items-center gap-2">
					<History className="w-4 h-4" /> Lihat History
				</Button>
			</div>

			{/* ── SECTION 1: Upload + Sidebar — grid layout (4 and 8) ── */}
			<div className="grid grid-cols-12 gap-4 items-start w-full min-w-0">
				{/* Sidebar: col-span-4 (Left Side) */}
				<div className="col-span-12 md:col-span-4 flex flex-col gap-3">
					<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
						<label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Jenis Dokumen</label>
						<Select 
							options={DOCUMENT_OPTIONS} 
							value={docType}
							onChange={(v) => v && setDocType(v)}
							className="text-sm"
							styles={{
								control: (base) => ({ ...base, borderColor: '#e5e7eb', borderRadius: '0.5rem', minHeight: '38px' }),
								menu: (base) => ({ ...base, zIndex: 50 })
							}}
						/>
						<p className="text-[10px] text-gray-400 mt-1.5">Trunkline & Land Cert — coming soon</p>

						<div className="mt-4 grid grid-cols-2 gap-2">
							{docType.value === "MIT" ? (
								<div>
									<label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Quartal</label>
									<Select 
										options={QUARTER_OPTIONS} 
										value={quarter}
										onChange={(v) => v && setQuarter(v)}
										className="text-sm"
										styles={{
											control: (base) => ({ ...base, borderColor: '#e5e7eb', borderRadius: '0.5rem', minHeight: '38px' }),
											menu: (base) => ({ ...base, zIndex: 50 })
										}}
									/>
								</div>
							) : (
								<div>
									<label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Bulan</label>
									<Select 
										options={MONTH_OPTIONS} 
										value={month}
										onChange={(v) => v && setMonth(v)}
										className="text-sm"
										styles={{
											control: (base) => ({ ...base, borderColor: '#e5e7eb', borderRadius: '0.5rem', minHeight: '38px' }),
											menu: (base) => ({ ...base, zIndex: 50 })
										}}
									/>
								</div>
							)}
							<div>
								<label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Tahun</label>
								<Select 
									options={YEAR_OPTIONS} 
									value={year}
									onChange={(v) => v && setYear(v)}
									className="text-sm"
									styles={{
										control: (base) => ({ ...base, borderColor: '#e5e7eb', borderRadius: '0.5rem', minHeight: '38px' }),
										menu: (base) => ({ ...base, zIndex: 50 })
									}}
								/>
							</div>
						</div>
					</div>

					<div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
						<h3 className="text-sm font-semibold text-blue-900 mb-1">Butuh template?</h3>
						<p className="text-xs text-blue-700 mb-3">Gunakan template resmi agar kolom sesuai database.</p>
						<a href={
							docType.value === "MIT" ? "/templates/Template MIT Quartal.xlsx"
							: docType.value === "HAZID" ? "/templates/Template HAZID.xlsx"
							: docType.value === "HAZOP" ? "/templates/Template HAZOP.xlsx"
							: "/templates/Template LOPA.xlsx"
						} download>
							<Button variant="blue" size="sm" className="w-full justify-center gap-2">
								<Download className="w-4 h-4" /> Download Template
							</Button>
						</a>
					</div>
				</div>

				{/* Upload zone: col-span-8 (Right Side) */}
				<div className="col-span-12 md:col-span-8 bg-white rounded-xl border border-gray-200 shadow-sm p-5 h-full">
					<div {...getRootProps()} className={cn(
						"border-2 border-dashed rounded-xl p-10 h-full flex flex-col items-center justify-center text-center transition-colors select-none min-h-[250px]",
						isDragActive ? "border-blue-500 bg-blue-50 cursor-copy"
							: "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
					)}>
						<input {...getInputProps()} />
						<UploadCloud className={cn("mx-auto h-10 w-10 mb-3", isDragActive ? "text-blue-500" : "text-gray-400")} />
						{processing
							? <p className="text-sm text-gray-500 animate-pulse">Memproses file…</p>
							: <>
								<p className="text-sm font-medium text-gray-700">{isDragActive ? "Lepaskan file di sini…" : "Drag & drop file .xlsx ke sini, atau klik untuk memilih"}</p>
								<p className="text-xs text-gray-400 mt-1">Hanya .xlsx / .xls • Gunakan template resmi</p>
							</>
						}
					</div>
				</div>
			</div>

			{/* ── SECTION 2: Toolbar (summary + Push to DB + Column toggler) ── */}
			{data.length > 0 && (
				<div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-3 flex flex-wrap gap-3 items-center justify-between w-full min-w-0">
					<div className="flex gap-3 flex-wrap">
						{[
							{ label: "Total", val: total, cls: "border-gray-200 text-gray-900" },
							{ label: "Valid", val: valid, cls: "border-green-100 bg-green-50 text-green-700" },
							{ label: "Error", val: errors, cls: "border-red-100 bg-red-50 text-red-700" },
						].map(({ label, val, cls }) => (
							<div key={label} className={cn("px-3 py-1.5 rounded-lg border flex items-center gap-2 shadow-sm", cls)}>
								<span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</span>
								<span className="text-base font-bold leading-none">{val}</span>
							</div>
						))}
					</div>

					<div className="flex items-center gap-2">
						{/* Column Toggler Dropdown */}
						<div className="relative" ref={colMenuRef}>
							<Button variant="outline" size="sm" className="flex items-center gap-2"
								onClick={() => setColMenuOpen(p => !p)}>
								<Columns className="w-4 h-4" />
								Kolom
								<span className="text-[10px] bg-blue-100 text-blue-700 rounded-full px-1.5 font-bold">
									{Object.values(extraCols).filter(Boolean).length}
								</span>
							</Button>
							{colMenuOpen && (
								<div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-3">
									<p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Tampilkan Kolom Tambahan</p>
									<div className="flex flex-col gap-0.5 max-h-64 overflow-y-auto">
										{extraHeaders.map(col => (
											<label key={col} className="flex items-start gap-2 px-2 py-1.5 hover:bg-gray-50 rounded-lg cursor-pointer">
												<input type="checkbox" checked={!!extraCols[col]}
													onChange={() => setExtraCols(p => ({ ...p, [col]: !p[col] }))}
													className="mt-0.5 rounded border-gray-300 text-blue-600 shrink-0" />
												<span className="text-xs text-gray-700 leading-snug">{col}</span>
											</label>
										))}
									</div>
								</div>
							)}
						</div>

						<Button onClick={handleSubmit} variant="blue" disabled={!canSubmit || isUploading || isCheckingPeriod} isLoading={isUploading || isCheckingPeriod} className="flex items-center gap-2">
							<Save className="w-4 h-4" /> Simpan Data
						</Button>
					</div>
				</div>
			)}

			{/* ── SECTION 3: Table — OWN scroll box, completely isolated ── */}
			{data.length > 0 && (
				<div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden w-full max-w-full">
					{/* Only this div scrolls — parent stays fixed width */}
					<div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: "520px" }}>
						<table className="min-w-max" style={{ borderCollapse: "collapse" }}>
							<thead className="sticky top-0 z-20">
								{table.getHeaderGroups().map(hg => (
									<tr key={hg.id}>
										{hg.headers.map((header, hi) => (
											<th key={header.id}
												className={cn(
													"px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide bg-gray-100 border-b border-gray-200 whitespace-nowrap",
													hi < 3 && "sticky z-30 bg-gray-100",
													hi === 0 && "left-0 shadow-[2px_0_0_0_#e5e7eb]",
													hi === 1 && "left-9",
													hi === 2 && "left-[4rem]",
												)}>
												{flexRender(header.column.columnDef.header, header.getContext())}
											</th>
										))}
									</tr>
								))}
							</thead>
							<tbody>
								{table.getRowModel().rows.map(row => (
									<tr key={row.id} onClick={() => setSelectedRow(row.original)}
										className={cn("border-b border-gray-100 cursor-pointer transition-colors group",
											!row.original._isValid ? "bg-red-50 hover:bg-red-100/60" : "bg-white hover:bg-blue-50/40")}>
										{row.getVisibleCells().map((cell, ci) => (
											<td key={cell.id}
												className={cn(
													"px-3 py-2.5 align-middle",
													ci < 3 && "sticky z-10",
													ci === 0 && "left-0 shadow-[2px_0_0_0_#f3f4f6]",
													ci === 1 && "left-9",
													ci === 2 && "left-[4rem]",
													!row.original._isValid
														? "bg-red-50 group-hover:bg-red-100/60"
														: "bg-white group-hover:bg-blue-50/40",
												)}>
												{flexRender(cell.column.columnDef.cell, cell.getContext())}
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* Detail Modal (Centered) */}
			<Transition.Root show={selectedRow !== null} as={Fragment}>
				<Dialog as="div" className="relative z-[999]" onClose={() => setSelectedRow(null)}>
					<Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
						<div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />
					</Transition.Child>

					<div className="fixed inset-0 z-10 w-screen overflow-y-auto">
						<div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
							<Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
								<Dialog.Panel className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl max-h-[90vh] flex flex-col">
									<div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
										<div>
											<Dialog.Title className="text-base font-semibold text-gray-900">Detail {docType.value}</Dialog.Title>
											<p className="text-xs text-gray-500 font-mono mt-0.5">Row #{selectedRow?._index}</p>
										</div>
										<button onClick={() => setSelectedRow(null)} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors">
											<X className="h-5 w-5" />
										</button>
									</div>
									{selectedRow && (
										<div className="flex-1 overflow-y-auto px-6 py-5">
											<div className="flex flex-col gap-6">
												{!selectedRow._isValid && (
													<div className="rounded-lg bg-red-50 border border-red-200 p-4">
														<h4 className="text-sm font-bold text-red-700 flex items-center gap-2 mb-2"><AlertCircle className="w-4 h-4" />Validation Errors</h4>
														<ul className="list-disc pl-5 text-sm text-red-600 space-y-1">
															{selectedRow._errors.map((e, i) => <li key={i}>{e}</li>)}
														</ul>
													</div>
												)}
												{docType.value === "MIT" ? DRAWER_SECTIONS.map(sec => (
													<div key={sec.title}>
														<h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-3">{sec.title}</h4>
														<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
															{sec.keys.map(k => (
																<div key={k} className={LONG_KEYS.has(k) ? "col-span-1 md:col-span-2 lg:col-span-3" : ""}>
																	<p className="text-[11px] text-gray-500 mb-1">{k}</p>
																	<p className="text-sm font-medium text-gray-900 whitespace-pre-wrap break-words">
																		{selectedRow[k] || <span className="text-gray-300 italic">—</span>}
																	</p>
																</div>
															))}
														</div>
													</div>
												)) : (
													<div>
														<h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-3">Data {docType.value}</h4>
														<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
															{Object.keys(selectedRow).filter(k => !k.startsWith("_")).map(k => (
																<div key={k} className={LONG_KEYS.has(k) || k.length > 20 ? "col-span-1 md:col-span-2 lg:col-span-3" : ""}>
																	<p className="text-[11px] text-gray-500 mb-1">{k}</p>
																	<p className="text-sm font-medium text-gray-900 whitespace-pre-wrap break-words">
																		{selectedRow[k] || <span className="text-gray-300 italic">—</span>}
																	</p>
																</div>
															))}
														</div>
													</div>
												)}
											</div>
										</div>
									)}
								</Dialog.Panel>
							</Transition.Child>
						</div>
					</div>
				</Dialog>
			</Transition.Root>

			{/* Confirm Overwrite / Append Modal */}
			<Transition.Root show={confirmModalOpen} as={Fragment}>
				<Dialog as="div" className="relative z-[999]" onClose={() => !isUploading && setConfirmModalOpen(false)}>
					<Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
						<div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />
					</Transition.Child>

					<div className="fixed inset-0 z-10 w-screen overflow-y-auto">
						<div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
							<Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
								<Dialog.Panel className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
									<div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
										<div className="sm:flex sm:items-start">
											<div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
												<AlertCircle className="h-6 w-6 text-yellow-600" aria-hidden="true" />
											</div>
											<div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
												<Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
													Data Periode Ini Sudah Ada
												</Dialog.Title>
												<div className="mt-2">
													<p className="text-sm text-gray-500">
														Data {docType.value} untuk <b>{docType.value === "MIT" ? quarter.value : month.label} Tahun {year.value}</b> sudah tersedia di database. Apakah kamu ingin mengganti seluruh data lama (Ganti Data) atau menambahkannya saja (Tambah Data)?
													</p>
												</div>
											</div>
										</div>
									</div>
									<div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-3">
										<Button 
											variant="red" 
											onClick={() => handleProceedUpload("overwrite")}
											disabled={isUploading}
											className="w-full sm:w-auto"
										>
											Ganti Data
										</Button>
										<Button 
											variant="blue" 
											onClick={() => handleProceedUpload("append")}
											disabled={isUploading}
											className="w-full sm:w-auto mt-3 sm:mt-0"
										>
											Tambah Data
										</Button>
										<Button 
											variant="outline" 
											onClick={() => setConfirmModalOpen(false)}
											disabled={isUploading}
											className="w-full sm:w-auto mt-3 sm:mt-0 mr-auto"
										>
											Batal
										</Button>
									</div>
								</Dialog.Panel>
							</Transition.Child>
						</div>
					</div>
				</Dialog>
			</Transition.Root>
		</div>
	);
}
