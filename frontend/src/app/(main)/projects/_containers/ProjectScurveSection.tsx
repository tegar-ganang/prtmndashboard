"use client";

import { useRef, useState } from "react";
import { ChevronDown, Download, Upload, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "@/services/api/main/interceptor";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import { formatProjectDate } from "../_lib/projectTransform";
import { useScurveProgressQuery } from "../_hooks/useScurveProgressQuery";
import { useScurveSummaryQuery } from "../_hooks/useScurveSummaryQuery";
import { useScurveUploadsQuery } from "../_hooks/useScurveUploadsQuery";
import { useUploadScurveMutation } from "../_hooks/useUploadScurveMutation";
import ProjectScurveChart from "../_components/ProjectScurveChart";

const formatPercent = (value: number | null) => (value == null ? "-" : `${value}%`);

export default function ProjectScurveSection({
	projectId,
	canUpload,
}: {
	projectId: string;
	canUpload: boolean;
}) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [downloadingId, setDownloadingId] = useState<string | null>(null);

	const { data: progress, isLoading: isProgressLoading } = useScurveProgressQuery(projectId);
	const { data: summary } = useScurveSummaryQuery(projectId);
	const { data: uploads } = useScurveUploadsQuery(projectId);
	const uploadMutation = useUploadScurveMutation(projectId);

	const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			uploadMutation.mutate(file);
		}
		e.target.value = "";
	};

	const handleDownloadUpload = async (uploadId: string, fileName: string) => {
		setDownloadingId(uploadId);
		try {
			const response = await axiosInstance.get(MAIN_ENDPOINT.Projects.ScurveDownload(projectId, uploadId), {
				responseType: "blob",
			});
			const url = window.URL.createObjectURL(new Blob([response.data]));
			const link = document.createElement("a");
			link.href = url;
			link.download = fileName;
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(url);
		} catch {
			toast.error("Gagal mengunduh file.");
		} finally {
			setDownloadingId(null);
		}
	};

	// project_progress only ever holds the latest uploaded snapshot (replaced on every
	// upload, not kept per-week like project_progress_summary) — so this date is fixed
	// to that snapshot's own periode_data, independent of whatever point is selected on
	// the chart above.
	const progressPeriodeData = progress && progress.length > 0 ? progress[0].periode_data : null;

	return (
		<section className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-5 lg:p-6 space-y-5">
			<div className="flex items-center justify-between gap-4 flex-wrap">
				<div>
					<h2 className="text-lg font-bold text-gray-900">S-Curve Progress</h2>
					<p className="text-sm text-gray-500 mt-0.5">
						Upload laporan mingguan (.xlsx, sheet "Exe Sum" + "S-Overall") untuk memperbarui progress project.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<a
						href="/templates/Template - SCurve.xlsx"
						download
						className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
					>
						<Download className="w-4 h-4" />
						Download Contoh File
					</a>
					{canUpload && (
					<input
						ref={fileInputRef}
						type="file"
						accept=".xlsx"
						className="hidden"
						onChange={handleFileSelected}
					/>
					)}
					{canUpload && (
					<button
						onClick={() => fileInputRef.current?.click()}
						disabled={uploadMutation.isPending}
						className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-[#008A45] text-white hover:bg-[#007038] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{uploadMutation.isPending ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Upload className="w-4 h-4" />
						)}
						Upload S-Curve
					</button>
					)}
				</div>
			</div>

			{summary && summary.length > 0 && (
				<div className="border-t border-gray-100 pt-4">
					<ProjectScurveChart data={summary} />
				</div>
			)}

			{isProgressLoading ? (
				<p className="text-sm text-gray-500">Loading progress...</p>
			) : !progress || progress.length === 0 ? (
				<p className="text-sm text-gray-400">Belum ada data progress. Upload file S-Curve untuk memulai.</p>
			) : (
				<div className="space-y-2">
					<h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
						Breakdown per Discipline — Snapshot Laporan Terakhir
					</h3>
					<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead className="bg-gray-50 border-b border-gray-200">
							<tr>
								{["No", "Description", "WF", "This Week Actual", "This Week Variance", "To Date Actual", "To Date Variance"].map(
									(h) => (
										<th
											key={h}
											className="px-3 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap"
										>
											{h}
										</th>
									),
								)}
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-50">
							{progress.map((row) => (
								<tr key={row.id} className="hover:bg-green-50/30 transition-colors">
									<td className="px-3 py-2.5 text-xs text-gray-500">{row.item_no}</td>
									<td className="px-3 py-2.5 text-xs text-gray-900 max-w-md">{row.description}</td>
									<td className="px-3 py-2.5 text-xs text-gray-600">{formatPercent(row.wf)}</td>
									<td className="px-3 py-2.5 text-xs font-semibold text-emerald-700">
										{formatPercent(row.this_week_actual)}
									</td>
									<td className="px-3 py-2.5 text-xs text-gray-600">{formatPercent(row.this_week_variance)}</td>
									<td className="px-3 py-2.5 text-xs font-semibold text-blue-700">
										{formatPercent(row.to_date_actual)}
									</td>
									<td className="px-3 py-2.5 text-xs text-gray-600">{formatPercent(row.to_date_variance)}</td>
								</tr>
							))}
						</tbody>
					</table>
					</div>
					{progressPeriodeData && (
						<p className="text-xs text-gray-400">
							Data per: {formatProjectDate(progressPeriodeData)}
						</p>
					)}
				</div>
			)}

			{uploads && uploads.length > 0 && (
				<details className="group border-t border-gray-100 pt-4">
					<summary className="flex cursor-pointer select-none list-none items-center justify-between [&::-webkit-details-marker]:hidden">
						<h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
							Riwayat Upload ({uploads.length})
						</h3>
						<ChevronDown className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" />
					</summary>
					<ul className="space-y-1 mt-2">
						{uploads.map((u) => (
							<li key={u.id}>
								<button
									type="button"
									onClick={() => handleDownloadUpload(u.id, u.file_name)}
									disabled={downloadingId === u.id}
									className="w-full flex items-center justify-between gap-3 text-xs text-gray-600 rounded-lg px-2 py-1.5 -mx-2 hover:bg-blue-50 hover:text-blue-700 transition-colors disabled:opacity-50 group"
								>
									<span className="flex items-center gap-1.5 truncate">
										{downloadingId === u.id ? (
											<Loader2 className="w-3.5 h-3.5 flex-shrink-0 animate-spin" />
										) : (
											<Download className="w-3.5 h-3.5 flex-shrink-0 text-gray-400 group-hover:text-blue-600" />
										)}
										<span className="truncate">{u.file_name}</span>
									</span>
									<span className="text-gray-400 whitespace-nowrap ml-3">
										{formatProjectDate(u.uploaded_at)}
									</span>
								</button>
							</li>
						))}
					</ul>
				</details>
			)}
		</section>
	);
}
