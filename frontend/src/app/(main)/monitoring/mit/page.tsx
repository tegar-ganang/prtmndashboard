"use client";

import { useState } from "react";
import MonitoringView from "../_components/MonitoringView";

export default function MitMocPage() {
	const [activeTab, setActiveTab] = useState<"mit" | "moc">("mit");

	return (
		<div className="flex flex-col gap-5 p-6 w-full min-w-0">
			<div className="flex border-b border-gray-200">
				<button
					type="button"
					onClick={() => setActiveTab("mit")}
					className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 ${
						activeTab === "mit"
							? "border-blue-600 text-blue-600"
							: "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
					}`}
				>
					Major Integrity Threat (MIT)
				</button>
				<button
					type="button"
					onClick={() => setActiveTab("moc")}
					className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 ${
						activeTab === "moc"
							? "border-blue-600 text-blue-600"
							: "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
					}`}
				>
					Management of Change (MOC)
				</button>
			</div>

			<div className="transition-all duration-300">
				<MonitoringView docTypeSlug={activeTab} />
			</div>
		</div>
	);
}
