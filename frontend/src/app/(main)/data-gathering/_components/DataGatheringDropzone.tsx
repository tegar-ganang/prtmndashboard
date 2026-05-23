"use client";

import { UploadCloud } from "lucide-react";

import clsxm from "@/lib/clsxm";

interface DataGatheringDropzoneProps {
	getRootProps: () => Record<string, unknown>;
	getInputProps: () => Record<string, unknown>;
	isDragActive: boolean;
	processing: boolean;
}

export default function DataGatheringDropzone({
	getRootProps,
	getInputProps,
	isDragActive,
	processing,
}: DataGatheringDropzoneProps) {
	return (
		<div className="col-span-12 md:col-span-8 bg-white rounded-xl border border-gray-200 shadow-sm p-5 h-full">
			<div
				{...getRootProps()}
				className={clsxm(
					"border-2 border-dashed rounded-xl p-10 h-full flex flex-col items-center justify-center text-center transition-colors select-none min-h-[250px]",
					isDragActive
						? "border-blue-500 bg-blue-50 cursor-copy"
						: "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
				)}
			>
				<input {...getInputProps()} />
				<UploadCloud className={clsxm("mx-auto h-10 w-10 mb-3", isDragActive ? "text-blue-500" : "text-gray-400")} />
				{processing ? (
					<p className="text-sm text-gray-500 animate-pulse">Memproses file…</p>
				) : (
					<>
						<p className="text-sm font-medium text-gray-700">
							{isDragActive ? "Lepaskan file di sini…" : "Drag & drop file .xlsx ke sini, atau klik untuk memilih"}
						</p>
						<p className="text-xs text-gray-400 mt-1">Hanya .xlsx / .xls • Gunakan template resmi</p>
					</>
				)}
			</div>
		</div>
	);
}
