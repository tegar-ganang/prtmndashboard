"use client";

import { useEffect, useRef, useState } from "react";
import { Columns, Save } from "lucide-react";

import Button from "@/components/button/Button";
import clsxm from "@/lib/clsxm";
import type { ExtraColumnsState } from "../_types";

interface DataGatheringToolbarProps {
	total: number;
	valid: number;
	errors: number;
	extraHeaders: string[];
	extraCols: ExtraColumnsState;
	onToggleExtraCol: (col: string) => void;
	onSubmit: () => void;
	canSubmit: boolean;
	isUploading: boolean;
	isCheckingPeriod: boolean;
}

export default function DataGatheringToolbar({
	total,
	valid,
	errors,
	extraHeaders,
	extraCols,
	onToggleExtraCol,
	onSubmit,
	canSubmit,
	isUploading,
	isCheckingPeriod,
}: DataGatheringToolbarProps) {
	const [colMenuOpen, setColMenuOpen] = useState(false);
	const colMenuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) {
				setColMenuOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	const selectedCount = Object.values(extraCols).filter(Boolean).length;

	return (
		<div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-3 flex flex-wrap gap-3 items-center justify-between w-full min-w-0">
			<div className="flex gap-3 flex-wrap">
				{[
					{ label: "Total", val: total, cls: "border-gray-200 text-gray-900" },
					{ label: "Valid", val: valid, cls: "border-green-100 bg-green-50 text-green-700" },
					{ label: "Error", val: errors, cls: "border-red-100 bg-red-50 text-red-700" },
				].map(({ label, val, cls }) => (
					<div key={label} className={clsxm("px-3 py-1.5 rounded-lg border flex items-center gap-2 shadow-sm", cls)}>
						<span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</span>
						<span className="text-base font-bold leading-none">{val}</span>
					</div>
				))}
			</div>

			<div className="flex items-center gap-2">
				<div className="relative" ref={colMenuRef}>
					<Button
						variant="outline"
						size="sm"
						className="flex items-center gap-2"
						onClick={() => setColMenuOpen((p) => !p)}
					>
						<Columns className="w-4 h-4" />
						Kolom
						<span className="text-[10px] bg-blue-100 text-blue-700 rounded-full px-1.5 font-bold">
							{selectedCount}
						</span>
					</Button>
					{colMenuOpen && (
						<div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-3">
							<p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Tampilkan Kolom Tambahan</p>
							<div className="flex flex-col gap-0.5 max-h-64 overflow-y-auto">
								{extraHeaders.map((col) => (
									<label key={col} className="flex items-start gap-2 px-2 py-1.5 hover:bg-gray-50 rounded-lg cursor-pointer">
										<input
											type="checkbox"
											checked={!!extraCols[col]}
											onChange={() => onToggleExtraCol(col)}
											className="mt-0.5 rounded border-gray-300 text-blue-600 shrink-0"
										/>
										<span className="text-xs text-gray-700 leading-snug">{col}</span>
									</label>
								))}
							</div>
						</div>
					)}
				</div>

				<Button
					onClick={onSubmit}
					variant="blue"
					disabled={!canSubmit || isUploading || isCheckingPeriod}
					isLoading={isUploading || isCheckingPeriod}
					className="flex items-center gap-2"
				>
					<Save className="w-4 h-4" /> Simpan Data
				</Button>
			</div>
		</div>
	);
}
