"use client";

import React, { use } from "react";
import MonitoringView from "../_components/MonitoringView";

export default function DynamicMonitoringPage({ params }: { params: Promise<{ docType: string }> }) {
	const { docType: docTypeSlug } = use(params);

	return (
		<div className="flex flex-col gap-5 p-6 w-full min-w-0">
			<MonitoringView docTypeSlug={docTypeSlug} />
		</div>
	);
}
