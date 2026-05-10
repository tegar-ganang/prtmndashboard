"use client";

import React, { useMemo, useState, use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
	createColumnHelper, 
	flexRender, 
	getCoreRowModel, 
	useReactTable,
	getPaginationRowModel,
} from "@tanstack/react-table";
import Select from "react-select";
import { History, X, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";

import Button from "@/components/button/Button";
import { useMonitoringData } from "../_hooks/useMonitoringData";
import { MONITORING_CONFIGS } from "../_configs/monitoringConfig";

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

export default function DynamicMonitoringPage({ params }: { params: Promise<{ docType: string }> }) {
	const { docType: docTypeSlug } = use(params);
	const searchParams = useSearchParams();
	const router = useRouter();
	
	const config = MONITORING_CONFIGS[docTypeSlug.toLowerCase()];
	const batchId = searchParams.get("batch_id");

	const [selectedYear, setSelectedYear] = useState<{value: number | null, label: string}>(YEAR_OPTIONS[0]);
	const [selectedPeriod, setSelectedPeriod] = useState<{value: number | null, label: string}>(
		config?.periodType === "quarter" ? QUARTER_OPTIONS[0] : MONTH_OPTIONS[0]
	);

	const { data = [], isLoading, error } = useMonitoringData(docTypeSlug, {
		batch_id: batchId,
		year: batchId ? null : selectedYear.value,
		month: (batchId || config?.periodType === "quarter") ? null : selectedPeriod.value,
		quarter: (batchId || config?.periodType === "month") ? null : selectedPeriod.value,
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

	const ch = createColumnHelper<any>();
	const columns = useMemo(() => {
		if (!config) return [];
		return config.getColumns(ch);
	}, [config, ch]);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		initialState: { pagination: { pageSize: 10 } },
	});

	if (!config) {
		return (
			<div className="p-10 text-center">
				<AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
				<h2 className="text-lg font-bold text-gray-900">Modul Tidak Ditemukan</h2>
				<p className="text-gray-500">URL yang Anda akses tidak valid.</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-5 p-6 w-full min-w-0">
			<div className="flex items-start justify-between">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">{config.title}</h1>
					<p className="text-sm text-gray-500 mt-0.5">Monitoring progress dan status {docTypeSlug.toUpperCase()}</p>
				</div>
				<Button 
					variant="outline" 
					onClick={() => router.push(`/monitoring/${docTypeSlug}/history`)}
					className="flex items-center gap-2"
				>
					<History className="w-4 h-4" /> History Upload
				</Button>
			</div>

			<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap items-center gap-4">
				{batchId ? (
					<div className="flex items-center gap-3 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg">
						<span className="text-xs font-semibold text-blue-700">Filter Aktif: Batch Upload</span>
						<span className="text-xs text-blue-600 bg-white px-2 py-0.5 rounded border border-blue-100 font-mono">{activeBatchLabel}</span>
						<button onClick={() => router.push(`/monitoring/${docTypeSlug}`)} className="p-1 hover:bg-blue-100 rounded-full text-blue-600">
							<X className="w-3.5 h-3.5" />
						</button>
					</div>
				) : (
					<>
						<div className="w-48">
							<label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Tahun</label>
							<Select 
								options={YEAR_OPTIONS} 
								value={selectedYear} 
								onChange={(v) => v && setSelectedYear(v)}
								className="text-xs"
								styles={{ control: (b) => ({ ...b, borderRadius: '0.5rem' }) }}
							/>
						</div>
						<div className="w-48">
							<label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">
								{config.periodType === "quarter" ? "Kuartal" : "Bulan"}
							</label>
							<Select 
								options={config.periodType === "quarter" ? QUARTER_OPTIONS : MONTH_OPTIONS} 
								value={selectedPeriod} 
								onChange={(v) => v && setSelectedPeriod(v)}
								className="text-xs"
								styles={{ control: (b) => ({ ...b, borderRadius: '0.5rem' }) }}
							/>
						</div>
					</>
				)}
			</div>

			<div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead className="bg-gray-50 border-b border-gray-200">
							{table.getHeaderGroups().map(headerGroup => (
								<tr key={headerGroup.id}>
									{headerGroup.headers.map(header => (
										<th key={header.id} className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
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
									<tr key={row.id} className="hover:bg-gray-50 transition-colors">
										{row.getVisibleCells().map(cell => (
											<td key={cell.id} className="px-4 py-3 border-b border-gray-50">
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
					<div className="text-xs text-gray-500">
						Menampilkan <span className="font-medium">{table.getRowModel().rows.length}</span> dari <span className="font-medium">{data.length}</span> data
					</div>
					<div className="flex items-center gap-2">
						<button 
							onClick={() => table.previousPage()} 
							disabled={!table.getCanPreviousPage()}
							className="p-1.5 rounded-lg border border-gray-200 bg-white disabled:opacity-30 hover:bg-gray-50"
						>
							<ChevronLeft className="w-4 h-4" />
						</button>
						<span className="text-xs font-medium text-gray-600 px-2">
							Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount()}
						</span>
						<button 
							onClick={() => table.nextPage()} 
							disabled={!table.getCanNextPage()}
							className="p-1.5 rounded-lg border border-gray-200 bg-white disabled:opacity-30 hover:bg-gray-50"
						>
							<ChevronRight className="w-4 h-4" />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
