"use client";

import { useState } from "react";
import MonitoringView from "../_components/MonitoringView";

export default function OpePage() {
	const [activeTab, setActiveTab] = useState<"hazid" | "hazop" | "lopa">("hazid");

	return (
		<div className="flex flex-col gap-5 p-6 w-full min-w-0">
			<div className="flex border-b border-gray-200">
				<button
					type="button"
					onClick={() => setActiveTab("hazid")}
					className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 ${
						activeTab === "hazid"
							? "border-blue-600 text-blue-600"
							: "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
					}`}
				>
					HAZID (Bulanan)
				</button>
				<button
					type="button"
					onClick={() => setActiveTab("hazop")}
					className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 ${
						activeTab === "hazop"
							? "border-blue-600 text-blue-600"
							: "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
					}`}
				>
					HAZOP (Bulanan)
				</button>
				<button
					type="button"
					onClick={() => setActiveTab("lopa")}
					className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 ${
						activeTab === "lopa"
							? "border-blue-600 text-blue-600"
							: "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
					}`}
				>
					LOPA (Bulanan)
				</button>
			</div>

			<div className="transition-all duration-300">
				<MonitoringView docTypeSlug={activeTab} />
			</div>
		</div>
	);
}
