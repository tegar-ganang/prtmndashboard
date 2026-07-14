"use client";

import { useState, useMemo } from "react";
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
	getPaginationRowModel,
} from "@tanstack/react-table";
import Select from "react-select";
import { History, ChevronLeft, ChevronRight, RotateCcw, Filter, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/button/Button";
import { useMonitoringData } from "../_hooks/useMonitoringData";
import { MONITORING_CONFIGS } from "../_configs/monitoringConfig";
import DataGatheringDetailModal from "../../data-gathering/_components/DataGatheringDetailModal";
import type { DocTypeValue } from "../../data-gathering/_constants/dataGathering.constants";

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [
	{ value: null as number | null, label: "Semua Tahun" },
	...Array.from({ length: 5 }, (_, i) => {
		const y = currentYear - 2 + i;
		return { value: y as number | null, label: String(y) };
	})
];

const SELECT_STYLES = {
	control: (b: any) => ({ ...b, borderRadius: "0.5rem", minHeight: "38px", borderColor: "#e5e7eb" }),
	menu: (b: any) => ({ ...b, zIndex: 50 }),
};

const LCV_TYPE_OPTIONS = [
	{ value: "lcv_project_charter_budaya", label: "Project Charter Budaya" },
	{ value: "lcv_monitoring", label: "Monitoring" },
];

const EMPTY_DATA: any[] = [];

export default function LcvMonitoringPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const batchId = searchParams.get("batch_id");
	const urlDocType = searchParams.get("doc_type");

	const initialType: "lcv_project_charter_budaya" | "lcv_monitoring" =
		urlDocType?.toLowerCase() === "lcv_monitoring" ? "lcv_monitoring" : "lcv_project_charter_budaya";

	const [activeType, setActiveType] = useState<"lcv_project_charter_budaya" | "lcv_monitoring">(initialType);
	const [selectedRow, setSelectedRow] = useState<any | null>(null);

	const [tempYear, setTempYear] = useState(YEAR_OPTIONS[0]);
	const [queryYear, setQueryYear] = useState(YEAR_OPTIONS[0]);

	const config = MONITORING_CONFIGS[activeType];

	const { data = EMPTY_DATA, isLoading } = useMonitoringData(activeType, {
		batch_id: batchId,
		year: queryYear.value,
	});

	const handleApply = () => setQueryYear(tempYear);

	const handleReset = () => {
		setTempYear(YEAR_OPTIONS[0]);
		setQueryYear(YEAR_OPTIONS[0]);
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

	const pageIndex = table.getState().pagination.pageIndex;
	const pageSize = table.getState().pagination.pageSize;
	const entryStart = data.length === 0 ? 0 : pageIndex * pageSize + 1;
	const entryEnd = Math.min((pageIndex + 1) * pageSize, data.length);

	const renderPaginationPageButtons = () => {
		const pageCount = table.getPageCount();
		const currentPage = table.getState().pagination.pageIndex;
		const buttons: number[] = [];
		if (pageCount <= 5) {
			for (let i = 0; i < pageCount; i++) buttons.push(i);
		} else {
			if (currentPage < 3) buttons.push(0, 1, 2, -1, pageCount - 1);
			else if (currentPage >= pageCount - 3) buttons.push(0, -1, pageCount - 3, pageCount - 2, pageCount - 1);
			else buttons.push(0, -1, currentPage - 1, currentPage, currentPage + 1, -1, pageCount - 1);
		}
		return buttons.map((p, idx) => {
			if (p === -1) return <span key={`ell-${idx}`} className="px-2 text-gray-400 font-bold">...</span>;
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

	return (
		<div className="flex flex-col gap-5 p-6 w-full min-w-0">
			{/* Header */}
			<div className="flex items-start justify-between">
				<div>
					<h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
						LCV Monitoring
						<span className="px-2.5 py-0.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full animate-pulse">
							Dummy Data
						</span>
					</h1>
					<p className="text-sm text-blue-600 font-medium mt-0.5">Loss Control &amp; Verification</p>
				</div>
				<Button
					variant="outline"
					onClick={() => router.push(`/monitoring/lcv/history?doc_type=${activeType.toUpperCase()}`)}
					className="flex items-center gap-2"
				>
					<History className="w-4 h-4" /> History Upload
				</Button>
			</div>

			{/* Tab switcher */}
			<div className="flex border-b border-gray-200">
				{LCV_TYPE_OPTIONS.map((opt) => (
					<button
						key={opt.value}
						type="button"
						onClick={() => {
							setActiveType(opt.value as any);
							handleReset();
						}}
						className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 ${
							activeType === opt.value
								? "border-[#008A45] text-[#008A45]"
								: "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
						}`}
					>
						{opt.label}
					</button>
				))}
			</div>

			{/* Filters */}
			<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
				<h3 className="text-sm font-bold text-gray-900 mb-4">Filter Data {config?.title}</h3>
				{batchId ? (
					<div className="flex items-center gap-3 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg w-fit">
						<span className="text-xs font-semibold text-blue-700">Filter Aktif: Batch Upload</span>
						<span className="text-xs text-blue-600 bg-white px-2 py-0.5 rounded border border-blue-100 font-mono">
							{batchId}
						</span>
						<button
							onClick={() => router.push(`/monitoring/lcv?doc_type=${activeType}`)}
							className="p-1 hover:bg-blue-100 rounded-full text-blue-600"
						>
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
								onChange={(v) => v && setTempYear(v as any)}
								className="text-xs"
								styles={SELECT_STYLES}
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

			{/* Table */}
			<div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead className="bg-gray-50 border-b border-gray-200">
							{table.getHeaderGroups().map((headerGroup) => (
								<tr key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<th
											key={header.id}
											className="px-4 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/70"
										>
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
											<td key={cidx} className="px-4 py-4">
												<div className="h-4 bg-gray-100 rounded w-full" />
											</td>
										))}
									</tr>
								))
							) : data.length === 0 ? (
								<tr>
									<td
										colSpan={columns.length}
										className="px-4 py-20 text-center text-gray-400 text-sm italic"
									>
										Tidak ada data ditemukan.
									</td>
								</tr>
							) : (
								table.getRowModel().rows.map((row) => (
									<tr
										key={row.id}
										onClick={() => setSelectedRow(row.original)}
										className="hover:bg-gray-50 transition-colors cursor-pointer"
									>
										{row.getVisibleCells().map((cell) => (
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

				{/* Pagination */}
				<div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
					<div className="text-sm text-gray-500 font-medium">
						Menampilkan{" "}
						<span className="font-semibold text-gray-800">{entryStart}</span>
						{" - "}
						<span className="font-semibold text-gray-800">{entryEnd}</span>
						{" dari "}
						<span className="font-semibold text-gray-800">{data.length}</span>
						{" data"}
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
				docType={activeType.toUpperCase() as DocTypeValue}
				selectedRow={selectedRow ? { ...selectedRow, _isValid: true, _errors: [] } : null}
				onClose={() => setSelectedRow(null)}
			/>
		</div>
	);
}
