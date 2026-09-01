import { useQuery } from "@tanstack/react-query";
import { get } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { GetSummaryResponse } from "@/types/projectScurve";

export const SCURVE_SUMMARY_QUERY_KEY = (projectId: string) =>
	["projects", projectId, "scurve", "summary"] as const;

export const useScurveSummaryQuery = (projectId: string) => {
	return useQuery({
		queryKey: [...SCURVE_SUMMARY_QUERY_KEY(projectId)],
		enabled: Boolean(projectId),
		queryFn: async () => {
			const { OK, Kind } = await get<GetSummaryResponse>(
				MAIN_ENDPOINT.Projects.ScurveSummary(projectId),
			);

			if (!OK) {
				throw new Error("Failed to fetch S-Curve summary.");
			}

			const response = Kind as GetSummaryResponse;

			if (!response.success) {
				throw new Error(response.message || "Failed to fetch S-Curve summary.");
			}

			return response.data;
		},
	});
};
