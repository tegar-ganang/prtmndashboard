"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
	createColumnHelper, 
	flexRender, 
	getCoreRowModel, 
	useReactTable,
	getPaginationRowModel,
} from "@tanstack/react-table";
import Select from "react-select";
import { 
	History, 
	X, 
	ChevronLeft, 
	ChevronRight, 
	AlertCircle, 
	RotateCcw, 
	Filter 
} from "lucide-react";

import Button from "@/components/button/Button";
import { useLocationsQuery } from "../../data-gathering/_hooks/useLocationsQuery";
import { useMonitoringData } from "../_hooks/useMonitoringData";
import { MONITORING_CONFIGS } from "../_configs/monitoringConfig";
import DataGatheringDetailModal from "../../data-gathering/_components/DataGatheringDetailModal";
import type { DocTypeValue } from "../../data-gathering/_constants/dataGathering.constants";

const MONTH_OPTIONS = [
	{ value: null, label: "Semua Bulan" },
	{ value: 1, label: "Januari" }, { value: 2, label: "Februari" }, { value: 3, label: "Maret" },
	{ value: 4, label: "April" }, { value: 5, label: "Mei" }, { value: 6, label: "Juni" },
	{ value: 7, label: "Juli" }, { value: 8, label: "Agustus" }, { value: 9, label: "September" },
	{ value: 10, label: "Oktober" }, { value: 11, label: "November" }, { value: 12, label: "Desember" },
];

const QUARTER_OPTIONS = [
	{ value: null, label: "Semua Kuartal" },
	{ value: 1, label: "Q1" },
	{ value: 2, label: "Q2" },
	{ value: 3, label: "Q3" },
	{ value: 4, label: "Q4" },
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [
	{ value: null, label: "Semua Tahun" },
	...Array.from({ length: 5 }, (_, i) => {
		const y = currentYear - 2 + i;
		return { value: y, label: String(y) };
	})
];

const EMPTY_DATA: any[] = [];

function TypingDescription({ text }: { text: string }) {
	const [displayedText, setDisplayedText] = useState("");

	useEffect(() => {
		let i = 0;
		let timeoutId: NodeJS.Timeout;
		let intervalId: NodeJS.Timeout;

		const startTyping = () => {
			i = 0;
			setDisplayedText("");
			intervalId = setInterval(() => {
				setDisplayedText(text.substring(0, i + 1));
				i++;
				if (i >= text.length) {
					clearInterval(intervalId);
					timeoutId = setTimeout(() => {
						startTyping();
					}, 3000);
				}
			}, 35);
		};

		startTyping();

		return () => {
			clearInterval(intervalId);
			clearTimeout(timeoutId);
		};
	}, [text]);

	return (
		<p className="text-sm text-blue-600 font-medium mt-0.5 min-h-[20px] flex items-center gap-0.5">
			{displayedText}
			<span className="animate-[pulse_1s_infinite] font-semibold text-blue-600">|</span>
		</p>
	);
}

interface MonitoringViewProps {
	docTypeSlug: string;
}

export default function MonitoringView({ docTypeSlug }: MonitoringViewProps) {
	const searchParams = useSearchParams();
	const router = useRouter();
	
	const config = MONITORING_CONFIGS[docTypeSlug.toLowerCase()];
	const batchId = searchParams.get("batch_id");
	
	const [selectedRow, setSelectedRow] = useState<any | null>(null);

	// Local Filter State (Unapplied)
	const [tempYear, setTempYear] = useState<{value: number | null, label: string}>(YEAR_OPTIONS[0]);
	const [tempPeriod, setTempPeriod] = useState<{value: number | null, label: string}>(
		config?.periodType === "quarter" ? QUARTER_OPTIONS[0] : MONTH_OPTIONS[0]
	);
	const [tempLocation, setTempLocation] = useState<{value: string | null, label: string}>({
		value: null,
		label: "Semua Lokasi",
	});

	// Applied Filter State (Sent to API)
	const [queryYear, setQueryYear] = useState<{value: number | null, label: string}>(YEAR_OPTIONS[0]);
	const [queryPeriod, setQueryPeriod] = useState<{value: number | null, label: string}>(
		config?.periodType === "quarter" ? QUARTER_OPTIONS[0] : MONTH_OPTIONS[0]
	);
	const [queryLocation, setQueryLocation] = useState<{value: string | null, label: string}>({
		value: null,
		label: "Semua Lokasi",
	});

	const { data: locationsData } = useLocationsQuery();

	const locationOptions = useMemo(() => {
		const baseOptions = [{ value: null, label: "Semua Lokasi" }];
		if (locationsData && locationsData.length > 0) {
			return [
				...baseOptions,
				...locationsData.map((loc) => ({
					value: loc.code,
					label: loc.name,
				})),
			];
		}
		return [
			...baseOptions,
			{ value: "DONGGI", label: "Donggi" },
			{ value: "MATINDOK", label: "Matindok" },
		];
	}, [locationsData]);

	const { data = EMPTY_DATA, isLoading, error } = useMonitoringData(docTypeSlug, {
		batch_id: batchId,
		year: batchId ? null : queryYear.value,
		month: (batchId || config?.periodType === "quarter") ? null : queryPeriod.value,
		quarter: (batchId || config?.periodType === "month") ? null : queryPeriod.value,
		field: batchId ? null : queryLocation.value,
	});

	const activeBatchLabel = useMemo(() => {
		if (batchId && data.length > 0) {
			const year = data[0].reporting_year;
			if (config?.periodType === "quarter") {
				return `Q${data[0].reporting_quarter} ${year}`;
			} else {
				const m = MONTH_OPTIONS.find(o => o.value === data[0].reporting_month)?.label || data[0].reporting_month;
				return `${m} ${year}`;
			}
		}
		return batchId;
	}, [batchId, data, config]);

	const handleApply = () => {
		setQueryYear(tempYear);
		setQueryPeriod(tempPeriod);
		setQueryLocation(tempLocation);
	};

	const handleReset = () => {
		const defaultPeriod = config?.periodType === "quarter" ? QUARTER_OPTIONS[0] : MONTH_OPTIONS[0];
		
		setTempYear(YEAR_OPTIONS[0]);
		setTempPeriod(defaultPeriod);
		setTempLocation({ value: null, label: "Semua Lokasi" });

		setQueryYear(YEAR_OPTIONS[0]);
		setQueryPeriod(defaultPeriod);
		setQueryLocation({ value: null, label: "Semua Lokasi" });
	};

	const columns = useMemo(() => {
		if (!config) return [];
		const ch = createColumnHelper<any>();
		return config.getColumns(ch);
	}, [config]);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		initialState: { pagination: { pageSize: 10 } },
	});

	if (!config) {
		return (
			<div className="p-10 text-center bg-white rounded-xl border border-gray-200 shadow-sm mt-4">
				<AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
				<h2 className="text-lg font-bold text-gray-900">Modul Tidak Ditemukan</h2>
				<p className="text-gray-500">URL atau tab monitoring yang Anda akses belum tersedia.</p>
			</div>
		);
	}

	const renderPaginationPageButtons = () => {
		const pageCount = table.getPageCount();
		const currentPage = table.getState().pagination.pageIndex;
		const buttons = [];

		if (pageCount <= 5) {
			for (let i = 0; i < pageCount; i++) {
				buttons.push(i);
			}
		} else {
			if (currentPage < 3) {
				buttons.push(0, 1, 2, -1, pageCount - 1);
			} else if (currentPage >= pageCount - 3) {
				buttons.push(0, -1, pageCount - 3, pageCount - 2, pageCount - 1);
			} else {
				buttons.push(0, -1, currentPage - 1, currentPage, currentPage + 1, -1, pageCount - 1);
			}
		}

		return buttons.map((p, idx) => {
			if (p === -1) {
				return <span key={`ell-${idx}`} className="px-2 text-gray-400 font-bold">...</span>;
			}
			const isActive = p === currentPage;
			return (
				<button
					key={p}
					onClick={() => table.setPageIndex(p)}
					className={`w-9 h-9 flex items-center justify-center rounded-lg border text-sm font-semibold transition-all ${
						isActive 
							? "border-[#008A45] text-[#008A45] bg-[#008A45]/5 font-bold" 
							: "border-gray-200 text-gray-600 hover:bg-gray-50 bg-white"
					}`}
				>
					{p + 1}
				</button>
			);
		});
	};

	// Determine pagination text boundaries
	const pageIndex = table.getState().pagination.pageIndex;
	const pageSize = table.getState().pagination.pageSize;
	const entryStart = data.length === 0 ? 0 : pageIndex * pageSize + 1;
	const entryEnd = Math.min((pageIndex + 1) * pageSize, data.length);

	return (
		<div className="flex flex-col gap-5 w-full min-w-0">
			<div className="flex items-start justify-between">
				<div>
					<h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
						{config.title}
						{(docTypeSlug.toLowerCase() === "airms" || docTypeSlug.toLowerCase() === "i2aims" || docTypeSlug.toLowerCase() === "hsse") && (
							<span className="px-2.5 py-0.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full animate-pulse">
								Dummy Data
							</span>
						)}
					</h1>
					<TypingDescription text={`Monitoring progress dan status ${docTypeSlug.toUpperCase()}`} />
				</div>
				<Button 
					variant="outline" 
					onClick={() => router.push(`/monitoring/${docTypeSlug}/history`)}
					className="flex items-center gap-2"
				>
					<History className="w-4 h-4" /> History Upload
				</Button>
			</div>

			<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
				<h3 className="text-sm font-bold text-gray-900 mb-4">Filter Data {docTypeSlug.toUpperCase()}</h3>
				{batchId ? (
					<div className="flex items-center gap-3 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg w-fit">
						<span className="text-xs font-semibold text-blue-700">Filter Aktif: Batch Upload</span>
						<span className="text-xs text-blue-600 bg-white px-2 py-0.5 rounded border border-blue-100 font-mono">{activeBatchLabel}</span>
						<button onClick={() => router.push(`/monitoring/${docTypeSlug}`)} className="p-1 hover:bg-blue-100 rounded-full text-blue-600">
							<X className="w-3.5 h-3.5" />
						</button>
					</div>
				) : (
					<div className="flex flex-wrap items-end gap-4">
						<div className="flex-1 min-w-[150px]">
							<label className="block text-xs font-semibold text-gray-500 mb-1.5 ml-0.5">Tahun</label>
							<Select 
								options={YEAR_OPTIONS} 
								value={tempYear} 
								onChange={(v) => v && setTempYear(v)}
								className="text-xs"
								styles={{ control: (b) => ({ ...b, borderRadius: '0.5rem', minHeight: '38px' }) }}
							/>
						</div>
						<div className="flex-1 min-w-[150px]">
							<label className="block text-xs font-semibold text-gray-500 mb-1.5 ml-0.5">
								{config.periodType === "quarter" ? "Kuartal" : "Bulan"}
							</label>
							<Select 
								options={config.periodType === "quarter" ? QUARTER_OPTIONS : MONTH_OPTIONS} 
								value={tempPeriod} 
								onChange={(v) => v && setTempPeriod(v)}
								className="text-xs"
								styles={{ control: (b) => ({ ...b, borderRadius: '0.5rem', minHeight: '38px' }) }}
							/>
						</div>
						<div className="flex-1 min-w-[180px]">
							<label className="block text-xs font-semibold text-gray-500 mb-1.5 ml-0.5">Lokasi / Field</label>
							<Select 
								options={locationOptions} 
								value={tempLocation} 
								onChange={(v) => v && setTempLocation(v)}
								className="text-xs"
								styles={{ control: (b) => ({ ...b, borderRadius: '0.5rem', minHeight: '38px' }) }}
							/>
						</div>
						<div className="flex items-center gap-3">
							<button
								onClick={handleReset}
								className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-sm rounded-lg transition-colors shadow-sm bg-white"
							>
								<RotateCcw className="w-4 h-4" /> Reset Filter
							</button>
							<button
								onClick={handleApply}
								className="flex items-center gap-2 px-4 py-2 bg-[#008A45] hover:bg-[#007038] text-white font-semibold text-sm rounded-lg transition-colors shadow-sm cursor-pointer"
							>
								<Filter className="w-4 h-4" /> Terapkan Filter
							</button>
						</div>
					</div>
				)}
			</div>

			<div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead className="bg-gray-50 border-b border-gray-200">
							{table.getHeaderGroups().map(headerGroup => (
								<tr key={headerGroup.id}>
									{headerGroup.headers.map(header => (
										<th key={header.id} className="px-4 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/70">
											{flexRender(header.column.columnDef.header, header.getContext())}
										</th>
									))}
								</tr>
							))}
						</thead>
						<tbody className="divide-y divide-gray-100">
							{isLoading ? (
								Array.from({ length: 5 }).map((_, idx) => (
									<tr key={idx} className="animate-pulse">
										{columns.map((_, cidx) => (
											<td key={cidx} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
										))}
									</tr>
								))
							) : data.length === 0 ? (
								<tr>
									<td colSpan={columns.length} className="px-4 py-20 text-center text-gray-400 text-sm italic">
										Tidak ada data ditemukan.
									</td>
								</tr>
							) : (
								table.getRowModel().rows.map(row => (
									<tr
										key={row.id}
										onClick={() => setSelectedRow(row.original)}
										className="hover:bg-gray-50 transition-colors cursor-pointer"
									>
										{row.getVisibleCells().map(cell => (
											<td key={cell.id} className="px-4 py-3.5 text-sm text-gray-800 align-middle">
												{flexRender(cell.column.columnDef.cell, cell.getContext())}
											</td>
										))}
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
				
				<div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
					<div className="text-sm text-gray-500 font-medium">
						Menampilkan <span className="font-semibold text-gray-800">{entryStart}</span> - <span className="font-semibold text-gray-800">{entryEnd}</span> dari <span className="font-semibold text-gray-800">{data.length}</span> data
					</div>
					<div className="flex items-center gap-2">
						<button 
							onClick={() => table.previousPage()} 
							disabled={!table.getCanPreviousPage()}
							className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white disabled:opacity-30 hover:bg-gray-50 transition-colors"
						>
							<ChevronLeft className="w-4 h-4" />
						</button>
						
						{renderPaginationPageButtons()}

						<button 
							onClick={() => table.nextPage()} 
							disabled={!table.getCanNextPage()}
							className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white disabled:opacity-30 hover:bg-gray-50 transition-colors"
						>
							<ChevronRight className="w-4 h-4" />
						</button>
					</div>
				</div>
			</div>
			<DataGatheringDetailModal
				docType={docTypeSlug.toUpperCase() as DocTypeValue}
				selectedRow={selectedRow ? { ...selectedRow, _isValid: true, _errors: [] } : null}
				onClose={() => setSelectedRow(null)}
			/>
		</div>
	);
}
