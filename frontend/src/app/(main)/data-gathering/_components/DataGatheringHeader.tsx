"use client";

import { History } from "lucide-react";
import { useRouter } from "next/navigation";

import Button from "@/components/button/Button";
import type { DocTypeValue } from "../_constants/dataGathering.constants";

interface DataGatheringHeaderProps {
	docType: DocTypeValue;
}

export default function DataGatheringHeader({ docType }: DataGatheringHeaderProps) {
	const router = useRouter();

	return (
		<div className="flex items-start justify-between">
			<div>
				<h1 className="text-2xl font-bold text-gray-900">Data Gathering</h1>
				<p className="text-sm text-gray-500 mt-0.5">Upload data MIT, HAZID, HAZOP, atau LOPA menggunakan template Excel yang disediakan.</p>
			</div>
			<Button
				variant="outline"
				onClick={() => router.push(`/monitoring/${docType.toLowerCase()}/history`)}
				className="flex items-center gap-2"
			>
				<History className="w-4 h-4" /> Lihat History
			</Button>
		</div>
	);
}
