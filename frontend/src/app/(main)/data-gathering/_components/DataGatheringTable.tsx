"use client";

import { useMemo } from "react";
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { AlertCircle, CheckCircle2, Eye } from "lucide-react";

import clsxm from "@/lib/clsxm";
import { DOC_TYPE_CONFIG, type DocTypeValue } from "../_constants/dataGathering.constants";
import type { ExcelRow, ExtraColumnsState } from "../_types";

interface DataGatheringTableProps {
	data: ExcelRow[];
	docType: DocTypeValue;
	extraHeaders: string[];
	extraCols: ExtraColumnsState;
	onSelectRow: (row: ExcelRow) => void;
}

export default function DataGatheringTable({
	data,
	docType,
	extraHeaders,
	extraCols,
	onSelectRow,
}: DataGatheringTableProps) {
	const ch = createColumnHelper<ExcelRow>();

	const badge = (value: any, type: "risk" | "status") => {
		if (!value) return <span className="text-gray-300">—</span>;
		const s = String(value).toLowerCase();
		const cls = type === "risk"
			? s.includes("high") || s.includes("critical")
				? "bg-red-100 text-red-700 border-red-200"
				: s.includes("medium")
				? "bg-yellow-100 text-yellow-700 border-yellow-200"
				: s.includes("low")
				? "bg-green-100 text-green-700 border-green-200"
				: "bg-gray-100 text-gray-600 border-gray-200"
			: s.includes("close")
			? "bg-green-100 text-green-700 border-green-200"
			: s.includes("progress") || s.includes("going")
			? "bg-blue-100 text-blue-700 border-blue-200"
			: "bg-gray-100 text-gray-600 border-gray-200";
		return (
			<span className={clsxm("px-2 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap", cls)}>
				{value}
			</span>
		);
	};

	const staticCols = useMemo(() => {
		const actionCol = ch.display({
			id: "_act",
			header: "",
			cell: (i) => (
				<button
					onClick={(e) => {
					e.stopPropagation();
					onSelectRow(i.row.original);
				}}
					className="p-1 text-blue-600 hover:bg-blue-50 rounded border border-gray-200 bg-white shadow-sm"
				>
					<Eye className="w-3.5 h-3.5" />
				</button>
			),
		});

		const validCol = ch.accessor("_isValid", {
			id: "_val",
			header: "Val.",
			cell: (i) =>
				i.getValue() ? (
					<CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
				) : (
					<AlertCircle className="w-3.5 h-3.5 text-red-500" />
				),
		});

		const noCol = ch.accessor("_index", {
			id: "_no",
			header: "#",
			cell: (i) => <span className="text-gray-400 text-xs">{i.getValue()}</span>,
		});

		const baseCols = [actionCol, validCol, noCol];

		if (docType === "MIT") {
			const targetClosingCol = ch.accessor("Target Closing", {
				header: "Target Closing",
				cell: (i) => <span className="text-xs text-gray-600 whitespace-nowrap">{i.getValue() || "—"}</span>,
			});

			baseCols.push(
				ch.accessor("Area", {
					header: "Area",
					cell: (i) => (
						<div className="w-24 truncate text-xs font-medium text-gray-900" title={i.getValue() as string}>
							{i.getValue() ? String(i.getValue()) : "—"}
						</div>
					),
				}),
				ch.accessor("No Registration - No", {
					header: "No. Reg",
					cell: (i) => (
						<div className="w-28 truncate text-xs font-mono text-gray-600" title={i.getValue() as string}>
							{i.getValue() ? String(i.getValue()) : "—"}
						</div>
					),
				}),
				ch.accessor("MIT Title / Asset", {
					header: "MIT Title / Asset",
					cell: (i) => (
						<div className="w-52 truncate text-xs font-medium text-gray-900" title={i.getValue() as string}>
							{i.getValue() ? String(i.getValue()) : "—"}
						</div>
					),
				}),
				ch.accessor("Current Risk - Risk", { header: "Current Risk", cell: (i) => badge(i.getValue(), "risk") }),
				ch.accessor("MIT Status", { header: "Status", cell: (i) => badge(i.getValue(), "status") }),
				ch.accessor("PIC", {
					header: "PIC",
					cell: (i) => (
						<div className="w-24 truncate text-xs text-gray-600" title={i.getValue() as string}>
							{i.getValue() ? String(i.getValue()) : "—"}
						</div>
					),
				}),
				targetClosingCol
			);
		} else {
			DOC_TYPE_CONFIG[docType].glanceCols.forEach((col) => {
				baseCols.push(
					ch.accessor(col, {
						header: col,
						cell: (i) => {
							const isRisk = col.includes("RISK");
							const isStatus = col.includes("STATUS");
							if (isRisk) return badge(i.getValue(), "risk");
							if (isStatus) return badge(i.getValue(), "status");
							return (
								<div className="w-32 truncate text-xs font-medium text-gray-900" title={i.getValue() as string}>
									{i.getValue() ? String(i.getValue()) : "—"}
								</div>
							);
						},
					})
				);
			});
		}

		return baseCols;
	}, [ch, docType, onSelectRow]);

	const dynCols = useMemo(
		() =>
			extraHeaders
				.filter((h) => extraCols[h])
				.map((h) =>
					ch.accessor(h, {
						header: h,
						cell: (i) => (
							<div
								className="min-w-[140px] max-w-xs truncate text-xs text-gray-700 whitespace-nowrap"
								title={String(i.getValue() ?? "")}
							>
								{i.getValue() ?? "—"}
							</div>
						),
					})
				),
		[extraHeaders, extraCols, ch]
	);

	const columns = useMemo(() => [...staticCols, ...dynCols], [staticCols, dynCols]);
	const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

	return (
		<div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden w-full max-w-full">
			<div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: "520px" }}>
				<table className="min-w-max" style={{ borderCollapse: "collapse" }}>
					<thead className="sticky top-0 z-20">
						{table.getHeaderGroups().map((hg) => (
							<tr key={hg.id}>
								{hg.headers.map((header, hi) => (
									<th
										key={header.id}
										className={clsxm(
											"px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide bg-gray-100 border-b border-gray-200 whitespace-nowrap",
											hi < 3 && "sticky z-30 bg-gray-100",
											hi === 0 && "left-0 shadow-[2px_0_0_0_#e5e7eb]",
											hi === 1 && "left-9",
											hi === 2 && "left-[4rem]"
										)}
									>
										{flexRender(header.column.columnDef.header, header.getContext())}
									</th>
								))}
							</tr>
						))}
					</thead>
					<tbody>
						{table.getRowModel().rows.map((row) => (
							<tr
								key={row.id}
								onClick={() => onSelectRow(row.original)}
								className={clsxm(
									"border-b border-gray-100 cursor-pointer transition-colors group",
									!row.original._isValid
										? "bg-red-50 hover:bg-red-100/60"
										: "bg-white hover:bg-blue-50/40"
								)}
							>
								{row.getVisibleCells().map((cell, ci) => (
									<td
										key={cell.id}
										className={clsxm(
											"px-3 py-2.5 align-middle",
											ci < 3 && "sticky z-10",
											ci === 0 && "left-0 shadow-[2px_0_0_0_#f3f4f6]",
											ci === 1 && "left-9",
											ci === 2 && "left-[4rem]",
											!row.original._isValid
												? "bg-red-50 group-hover:bg-red-100/60"
												: "bg-white group-hover:bg-blue-50/40"
										)}
									>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
