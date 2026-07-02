"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { useRouter } from "next/navigation";

import Button from "@/components/button/Button";
import type { DocTypeValue } from "../_constants/dataGathering.constants";

interface DataGatheringHeaderProps {
	docType: DocTypeValue;
}

export default function DataGatheringHeader({ docType }: DataGatheringHeaderProps) {
	const router = useRouter();
	const fullText = "Upload data menggunakan template Excel yang disediakan.";
	const [displayedText, setDisplayedText] = useState("");

	useEffect(() => {
		let i = 0;
		let timeoutId: NodeJS.Timeout;
		let intervalId: NodeJS.Timeout;

		const startTyping = () => {
			i = 0;
			setDisplayedText("");
			intervalId = setInterval(() => {
				setDisplayedText(fullText.substring(0, i + 1));
				i++;
				if (i >= fullText.length) {
					clearInterval(intervalId);
					timeoutId = setTimeout(() => {
						startTyping();
					}, 3000);
				}
			}, 30);
		};

		startTyping();

		return () => {
			clearInterval(intervalId);
			clearTimeout(timeoutId);
		};
	}, []);

	return (
		<div className="flex items-start justify-between">
			<div>
				<h1 className="text-2xl font-bold text-gray-900">Data Gathering</h1>
				<p className="text-sm text-blue-600 font-medium mt-0.5 min-h-[20px]">
					{displayedText}
					<span className="animate-[pulse_1s_infinite] font-semibold">|</span>
				</p>
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
