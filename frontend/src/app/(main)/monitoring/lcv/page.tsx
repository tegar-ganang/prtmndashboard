import { redirect } from "next/navigation";

// LCV children live at /monitoring/lcv_*; keeps old /monitoring/lcv?doc_type=&batch_id= links working.
export default async function LcvRedirect({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
	const { doc_type, batch_id } = await searchParams;
	const type = doc_type?.toLowerCase() === "lcv_monitoring" ? "lcv_monitoring" : "lcv_project_charter_budaya";
	redirect(`/monitoring/${type}${batch_id ? `?batch_id=${encodeURIComponent(batch_id)}` : ""}`);
}
