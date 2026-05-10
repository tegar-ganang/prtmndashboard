"use client";

import React, { useMemo, use } from "react";
import { useRouter } from "next/navigation";
import { 
	createColumnHelper, 
	flexRender, 
	getCoreRowModel, 
	useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { ChevronLeft, Calendar, FileSpreadsheet, ArrowRight, Loader2, AlertCircle } from "lucide-react";

import Button from "@/components/button/Button";
import { useMonitoringHistory } from "../../_hooks/useMonitoringData";
import { MONITORING_CONFIGS } from "../../_configs/monitoringConfig";

const MONTH_NAMES = [
	"Januari", "Februari", "Maret", "April", "Mei", "Juni",
	"Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function DynamicHistoryPage({ params }: { params: Promise<{ docType: string }> }) {
	const { docType: docTypeSlug } = use(params);
	const router = useRouter();
	
	const config = MONITORING_CONFIGS[docTypeSlug.toLowerCase()];
	const { data = [], isLoading } = useMonitoringHistory(docTypeSlug);

	const ch = createColumnHelper<any>();
	const columns = useMemo(() => [
		ch.accessor("upload_date", {
			header: "Tanggal Upload",
			cell: i => (
				<div className="flex items-center gap-3">
					<div className="p-2 bg-blue-50 rounded-lg">
						<Calendar className="w-4 h-4 text-blue-600" />
					</div>
					<div className="flex flex-col">
						<span className="text-sm font-semibold text-gray-900">{format(new Date(i.getValue()), "dd MMM yyyy")}</span>
						<span className="text-[10px] text-gray-400">{format(new Date(i.getValue()), "HH:mm")}</span>
					</div>
				</div>
			)
		}),
		ch.accessor("reporting_year", {
			header: "Periode",
			cell: i => {
				const row = i.row.original;
				const periodLabel = config?.periodType === "quarter" 
					? `Q${row.reporting_quarter}` 
					: MONTH_NAMES[row.reporting_month - 1];
				return (
					<div className="flex flex-col">
						<span className="text-sm font-medium text-gray-700">{periodLabel}</span>
						<span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{row.reporting_year}</span>
					</div>
				);
			}
		}),
		ch.accessor("record_count", {
			header: "Jumlah Data",
			cell: i => (
				<div className="flex items-center gap-2">
					<FileSpreadsheet className="w-3.5 h-3.5 text-gray-400" />
					<span className="text-sm font-medium text-gray-700">{i.getValue()} Baris</span>
				</div>
			)
		}),
		ch.display({
			id: "actions",
			header: "",
			cell: i => (
				<button 
					onClick={() => router.push(`/monitoring/${docTypeSlug}?batch_id=${i.row.original.upload_batch_id}`)}
					className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm"
				>
					Lihat Data <ArrowRight className="w-3 h-3" />
				</button>
			)
		})
	], [docTypeSlug, router, config]);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	if (!config) {
		return (
			<div className="p-10 text-center">
				<AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
				<h2 className="text-lg font-bold text-gray-900">Modul Tidak Ditemukan</h2>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6 p-6 w-full max-w-5xl mx-auto">
			<div className="flex items-center gap-4">
				<button 
					onClick={() => router.push(`/monitoring/${docTypeSlug}`)}
					className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
				>
					<ChevronLeft className="w-5 h-5 text-gray-600" />
				</button>
				<div>
					<h1 className="text-2xl font-bold text-gray-900">History Upload {docTypeSlug.toUpperCase()}</h1>
					<p className="text-sm text-gray-500">Daftar riwayat pembaharuan data {config.title}</p>
				</div>
			</div>

			<div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
				<table className="w-full text-left border-collapse">
					<thead className="bg-gray-50/50 border-b border-gray-200">
						{table.getHeaderGroups().map(headerGroup => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map(header => (
									<th key={header.id} className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
										{flexRender(header.column.columnDef.header, header.getContext())}
									</th>
								))}
							</tr>
						))}
					</thead>
					<tbody className="divide-y divide-gray-100">
						{isLoading ? (
							Array.from({ length: 3 }).map((_, idx) => (
								<tr key={idx} className="animate-pulse">
									{columns.map((_, cidx) => (
										<td key={cidx} className="px-6 py-6"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
									))}
								</tr>
							))
						) : data.length === 0 ? (
							<tr>
								<td colSpan={columns.length} className="px-6 py-20 text-center">
									<div className="flex flex-col items-center gap-2">
										<FileSpreadsheet className="w-10 h-10 text-gray-200" />
										<p className="text-gray-400 text-sm italic">Belum ada riwayat upload.</p>
									</div>
								</td>
							</tr>
						) : (
							table.getRowModel().rows.map(row => (
								<tr key={row.id} className="hover:bg-gray-50 transition-colors group">
									{row.getVisibleCells().map(cell => (
										<td key={cell.id} className="px-6 py-5">
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</td>
									))}
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
