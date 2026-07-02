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
					"border-2 border-dashed rounded-xl p-10 h-full flex flex-col items-center justify-center text-center transition-colors select-none min-h-[250px] group",
					isDragActive
						? "border-[#007038] bg-[#008A45]/15 cursor-copy"
						: "border-[#008A45] bg-[#008A45]/5 hover:border-[#007038] hover:bg-[#008A45]/10 cursor-pointer"
				)}
			>
				<input {...getInputProps()} />
				<UploadCloud className={clsxm("mx-auto h-10 w-10 mb-3 transition-colors", isDragActive ? "text-[#007038]" : "text-[#008A45] group-hover:text-[#007038]")} />
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
