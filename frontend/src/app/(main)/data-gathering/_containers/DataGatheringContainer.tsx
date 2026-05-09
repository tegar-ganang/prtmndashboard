"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect, Fragment } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import {
	Download, UploadCloud, AlertCircle, CheckCircle2, Save, X, Eye, Columns, ChevronDown
} from "lucide-react";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Dialog, Transition } from "@headlessui/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import toast from "react-hot-toast";

import Button from "@/components/button/Button";
import { useMitBatchMutation } from "../_hooks/useMitBatchMutation";

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

const GLANCE_COLS = [
	"Area", "No Registration - No", "MIT Title / Asset",
	"Current Risk - Risk", "MIT Status", "PIC", "Target Closing",
];

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

export default function DataGatheringContainer() {
	const [data, setData] = useState<ExcelRow[]>([]);
	const [processing, setProcessing] = useState(false);
	const [selectedRow, setSelectedRow] = useState<ExcelRow | null>(null);
	const [extraCols, setExtraCols] = useState<Record<string, boolean>>({});
	const [colMenuOpen, setColMenuOpen] = useState(false);
	const colMenuRef = useRef<HTMLDivElement>(null);

	const { mutate: uploadBatch, isPending: isUploading } = useMitBatchMutation({ onSuccess: () => setData([]) });

	// Close column menu on outside click
	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) setColMenuOpen(false);
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	const extraHeaders = useMemo(() =>
		data.length ? Object.keys(data[0]).filter(k => !k.startsWith("_") && !GLANCE_COLS.includes(k)) : []
	, [data]);

	const processExcel = useCallback((file: File) => {
		setProcessing(true);
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const wb = XLSX.read(e.target?.result, { type: "array", cellDates: true });
				const rawData = XLSX.utils.sheet_to_json<any[]>(wb.Sheets[wb.SheetNames[0]], { header: 1 });
				if (rawData.length <= 1) { toast.error("File kosong."); return; }

				const headers = (rawData[0] as any[]).map(h => h ? String(h).trim() : "");
				const missing = EXPECTED_HEADERS_MIT.filter(h => !headers.includes(h));
				if (missing.length) {
					toast.error(`Kolom tidak sesuai template!\nHilang: "${missing.slice(0, 2).join('", "')}..."`, { duration: 6000 });
					return;
				}

				const rows = rawData.slice(1).filter(r => r.some((c: any) => c != null && c !== ""));
				const parsed: ExcelRow[] = rows.map((row, i) => {
					const errors: string[] = [];
					const obj: ExcelRow = { _index: i + 1, _isValid: true, _errors: [] };
					headers.forEach((h, ci) => {
						if (!h) return;
						let v = row[ci];
						if (v instanceof Date) v = v.toISOString().split("T")[0];
						obj[h] = (v != null && v !== "") ? v : null;
					});
					if (!obj["MIT Title / Asset"]) errors.push("MIT Title / Asset wajib diisi");
					if (!obj["Area"]) errors.push("Area wajib diisi");
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
	}, []);

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
	const staticCols = useMemo(() => [
		ch.display({
			id: "_act", header: "",
			cell: i => (
				<button onClick={e => { e.stopPropagation(); setSelectedRow(i.row.original); }}
					className="p-1 text-blue-600 hover:bg-blue-50 rounded border border-gray-200 bg-white shadow-sm">
					<Eye className="w-3.5 h-3.5" />
				</button>
			),
		}),
		ch.accessor("_isValid", {
			id: "_val", header: "Val.",
			cell: i => i.getValue()
				? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
				: <AlertCircle className="w-3.5 h-3.5 text-red-500" />,
		}),
		ch.accessor("_index", { id: "_no", header: "#", cell: i => <span className="text-gray-400 text-xs">{i.getValue()}</span> }),
		ch.accessor("Area", {
			header: "Area",
			cell: i => <div className="w-24 truncate text-xs font-medium text-gray-900 whitespace-nowrap" title={i.getValue()}>{i.getValue() || "—"}</div>,
		}),
		ch.accessor("No Registration - No", {
			header: "No. Reg",
			cell: i => <div className="w-28 truncate text-xs font-mono text-gray-600 whitespace-nowrap" title={i.getValue()}>{i.getValue() || "—"}</div>,
		}),
		ch.accessor("MIT Title / Asset", {
			header: "MIT Title / Asset",
			cell: i => <div className="w-52 truncate text-xs font-medium text-gray-900 whitespace-nowrap" title={i.getValue()}>{i.getValue() || "—"}</div>,
		}),
		ch.accessor("Current Risk - Risk", { header: "Current Risk", cell: i => badge(i.getValue(), "risk") }),
		ch.accessor("MIT Status", { header: "Status", cell: i => badge(i.getValue(), "status") }),
		ch.accessor("PIC", {
			header: "PIC",
			cell: i => <div className="w-24 truncate text-xs text-gray-600 whitespace-nowrap" title={i.getValue()}>{i.getValue() || "—"}</div>,
		}),
		ch.accessor("Target Closing", {
			header: "Target Closing",
			cell: i => <span className="text-xs text-gray-600 whitespace-nowrap">{i.getValue() || "—"}</span>,
		}),
	], [ch]);

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
	const handleSubmit = () => { if (!canSubmit) return; const payload = data.map(({ _index, _isValid, _errors, ...rest }) => rest); uploadBatch({ doc_type: "MIT", items: payload }); };

	return (
		<div className="flex flex-col gap-5 p-6 pb-20 w-full min-w-0">
			<div>
				<h1 className="text-2xl font-bold text-gray-900">MIT Register — Data Gathering</h1>
				<p className="text-sm text-gray-500 mt-0.5">Upload data MIT Register menggunakan template Excel yang disediakan.</p>
			</div>

			{/* ── SECTION 1: Upload + Sidebar — fixed, no overflow, no stretch ── */}
			<div className="flex gap-4 items-start w-full min-w-0">
				{/* Upload zone: flex-1 but min-w-0 so it never pushes parent wider */}
				<div className="flex-1 min-w-0 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
					<div {...getRootProps()} className={cn(
						"border-2 border-dashed rounded-xl p-10 text-center transition-colors select-none",
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

				{/* Sidebar: strictly w-56, shrink-0 — NEVER grows */}
				<div className="w-56 shrink-0 flex flex-col gap-3">
					<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
						<label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Jenis Dokumen</label>
						<div className="relative">
							<select disabled className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 pr-8 bg-gray-50 cursor-not-allowed">
								<option>Major Integrity Threat (MIT)</option>
							</select>
							<ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
						</div>
						<p className="text-[10px] text-gray-400 mt-1.5">Trunkline & Land Cert — coming soon</p>
					</div>

					<div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
						<h3 className="text-sm font-semibold text-blue-900 mb-1">Butuh template?</h3>
						<p className="text-xs text-blue-700 mb-3">Gunakan template resmi agar kolom sesuai database.</p>
						<a href="/templates/Template MIT Quartal.xlsx" download>
							<Button variant="blue" size="sm" className="w-full justify-center gap-2">
								<Download className="w-4 h-4" /> Download Template
							</Button>
						</a>
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

						<Button onClick={handleSubmit} variant="blue" disabled={!canSubmit || isUploading} isLoading={isUploading} className="flex items-center gap-2">
							<Save className="w-4 h-4" /> Push to DB
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

			{/* Detail Drawer */}
			<Transition.Root show={selectedRow !== null} as={Fragment}>
				<Dialog as="div" className="relative z-[999]" onClose={() => setSelectedRow(null)}>
					<Transition.Child as={Fragment} enter="ease-in-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in-out duration-300" leaveFrom="opacity-100" leaveTo="opacity-0">
						<div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
					</Transition.Child>
					<div className="fixed inset-0 overflow-hidden">
						<div className="absolute inset-0 overflow-hidden">
							<div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
								<Transition.Child as={Fragment} enter="transform transition ease-in-out duration-300" enterFrom="translate-x-full" enterTo="translate-x-0" leave="transform transition ease-in-out duration-300" leaveFrom="translate-x-0" leaveTo="translate-x-full">
									<Dialog.Panel className="pointer-events-auto w-screen max-w-md">
										<div className="flex h-full flex-col bg-white shadow-2xl">
											<div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex items-center justify-between">
												<div>
													<Dialog.Title className="text-sm font-semibold text-gray-900">Detail MIT Register</Dialog.Title>
													<p className="text-xs text-gray-400 font-mono">Row #{selectedRow?._index}</p>
												</div>
												<button onClick={() => setSelectedRow(null)} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors">
													<X className="h-4 w-4" />
												</button>
											</div>
											{selectedRow && (
												<div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
													{!selectedRow._isValid && (
														<div className="rounded-lg bg-red-50 border border-red-200 p-3">
															<h4 className="text-xs font-bold text-red-700 flex items-center gap-1.5 mb-1.5"><AlertCircle className="w-3.5 h-3.5" />Validation Errors</h4>
															<ul className="list-disc pl-4 text-xs text-red-600 space-y-0.5">
																{selectedRow._errors.map((e, i) => <li key={i}>{e}</li>)}
															</ul>
														</div>
													)}
													{DRAWER_SECTIONS.map(sec => (
														<div key={sec.title}>
															<h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5 mb-2.5">{sec.title}</h4>
															<div className="grid grid-cols-2 gap-3">
																{sec.keys.map(k => (
																	<div key={k} className={LONG_KEYS.has(k) || sec.keys.length <= 3 ? "col-span-2" : ""}>
																		<p className="text-[10px] text-gray-400 mb-0.5">{k}</p>
																		<p className="text-xs font-medium text-gray-900 whitespace-pre-wrap break-words">
																			{selectedRow[k] || <span className="text-gray-300 italic">—</span>}
																		</p>
																	</div>
																))}
															</div>
														</div>
													))}
												</div>
											)}
										</div>
									</Dialog.Panel>
								</Transition.Child>
							</div>
						</div>
					</div>
				</Dialog>
			</Transition.Root>
		</div>
	);
}
