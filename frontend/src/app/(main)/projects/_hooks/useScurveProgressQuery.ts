import { useQuery } from "@tanstack/react-query";
import { get } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { GetProgressResponse } from "@/types/projectScurve";

export const SCURVE_PROGRESS_QUERY_KEY = (projectId: string) =>
	["projects", projectId, "scurve", "progress"] as const;

export const useScurveProgressQuery = (projectId: string) => {
	return useQuery({
		queryKey: [...SCURVE_PROGRESS_QUERY_KEY(projectId)],
		enabled: Boolean(projectId),
		queryFn: async () => {
			const { OK, Kind } = await get<GetProgressResponse>(
				MAIN_ENDPOINT.Projects.ScurveProgress(projectId),
			);

			if (!OK) {
				throw new Error("Failed to fetch S-Curve progress.");
			}

			const response = Kind as GetProgressResponse;

			if (!response.success) {
				throw new Error(response.message || "Failed to fetch S-Curve progress.");
			}

			return response.data;
		},
	});
};
