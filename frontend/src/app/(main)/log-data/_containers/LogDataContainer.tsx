"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { RefreshCw, PlayCircle } from "lucide-react";
import { useMemo } from "react";
import AccessDeniedCard from "@/components/feedback/AccessDeniedCard";
import Button from "@/components/button/Button";
import Table from "@/components/table/Table";
import useAuthStore from "@/app/stores/useAuthStore";
import type { MartSyncCountRow } from "@/types/martSync";
import { useMartSyncCountsQuery } from "../_hooks/useMartSyncCountsQuery";
import { useRunMartSyncMutation } from "../_hooks/useRunMartSyncMutation";

function CountCell({ count, error }: { count: number | null; error: string | null }) {
	if (error) return <span className="text-xs font-medium text-red-500">{error}</span>;
	if (count === null) return <span className="text-gray-400">—</span>;
	return <span className="font-mono">{count.toLocaleString("id-ID")}</span>;
}

function StatusBadge({ row }: { row: MartSyncCountRow }) {
	if (row.martError) {
		return (
			<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
				Belum Tersinkron
			</span>
		);
	}
	if (row.appCount !== null && row.martCount !== null && row.appCount === row.martCount) {
		return (
			<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
				Sesuai
			</span>
		);
	}
	const diff = (row.appCount ?? 0) - (row.martCount ?? 0);
	return (
		<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
			Selisih {Math.abs(diff)} baris
		</span>
	);
}

export default function LogDataContainer() {
	const currentUser = useAuthStore.useUser();
	const isAdmin = currentUser?.is_admin ?? false;

	const { data: rows = [], isLoading, isFetching, refetch } = useMartSyncCountsQuery();
	const { mutate: runSync, isPending: isSyncing, data: syncResult } = useRunMartSyncMutation();

	const columns = useMemo<ColumnDef<MartSyncCountRow>[]>(
		() => [
			{ accessorKey: "name", header: "Modul" },
			{
				id: "app",
				header: "App (app.*)",
				cell: ({ row }) => (
					<div className="flex flex-col">
						<span className="text-xs text-gray-400 font-mono">{row.original.appTable}</span>
						<CountCell count={row.original.appCount} error={row.original.appError} />
					</div>
				),
			},
			{
				id: "mart",
				header: "Mart (mart_pertamina.*)",
				cell: ({ row }) => (
					<div className="flex flex-col">
						<span className="text-xs text-gray-400 font-mono">{row.original.martTable}</span>
						<CountCell count={row.original.martCount} error={row.original.martError} />
					</div>
				),
			},
			{
				id: "status",
				header: "Status",
				cell: ({ row }) => <StatusBadge row={row.original} />,
			},
		],
		[],
	);

	if (!isAdmin) {
		return (
			<div className="p-6 lg:p-8 space-y-8 bg-gray-50 min-h-screen">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Log Data</h1>
					<p className="text-sm text-gray-600 mt-1">Cek status sinkronisasi data ke mart_pertamina.</p>
				</div>
				<AccessDeniedCard description="Halaman ini hanya bisa diakses oleh administrator. Hubungi administrator jika Anda memerlukan akses." />
			</div>
		);
	}

	return (
		<div className="p-6 lg:p-8 space-y-8 bg-gray-50 min-h-screen">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Log Data</h1>
					<p className="text-sm text-gray-600 mt-1">
						Bandingkan jumlah baris data di schema <code>app</code> dengan <code>mart_pertamina</code>, lalu jalankan sync jika diperlukan.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" leftIcon={RefreshCw} onClick={() => refetch()} disabled={isFetching}>
						Refresh
					</Button>
					<Button variant="blue" leftIcon={PlayCircle} onClick={() => runSync()} disabled={isSyncing}>
						{isSyncing ? "Menyinkronkan…" : "Sync Data"}
					</Button>
				</div>
			</div>

			<section className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-5 lg:p-6">
				<h2 className="text-lg font-semibold text-gray-900 mb-4">Perbandingan Jumlah Baris</h2>
				<Table className="text-black" data={rows} columns={columns} withEntries isLoading={isLoading} />
			</section>

			{syncResult && (
				<section className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-5 lg:p-6">
					<h2 className="text-lg font-semibold text-gray-900 mb-4">Hasil Sync Terakhir</h2>
					<div className="space-y-1.5">
						{syncResult.data.map((result, idx) => (
							<div
								key={`${result.name}-${idx}`}
								className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
									result.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
								}`}
							>
								<span className="font-medium">{result.name}</span>
								<span className="text-xs font-mono">
									{result.success ? "OK" : (result.error ?? "Gagal")}
								</span>
							</div>
						))}
					</div>
				</section>
			)}
		</div>
	);
}
