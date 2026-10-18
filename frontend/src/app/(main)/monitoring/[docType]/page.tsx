"use client";

import React, { use } from "react";
import MonitoringView from "../_components/MonitoringView";
import PsaimsMonitoring, { type PsaimsType } from "../_components/PsaimsMonitoring";
import LcvMonitoring, { type LcvType } from "../_components/LcvMonitoring";

export default function DynamicMonitoringPage({ params }: { params: Promise<{ docType: string }> }) {
	const { docType: docTypeSlug } = use(params);

	if (docTypeSlug === "zona_indicator" || docTypeSlug === "zona_pse_list") {
		return <PsaimsMonitoring activeType={docTypeSlug as PsaimsType} />;
	}
	if (docTypeSlug === "lcv_project_charter_budaya" || docTypeSlug === "lcv_monitoring") {
		return <LcvMonitoring activeType={docTypeSlug as LcvType} />;
	}

	return (
		<div className="flex flex-col gap-5 p-6 w-full min-w-0">
			<MonitoringView docTypeSlug={docTypeSlug} />
		</div>
	);
}
