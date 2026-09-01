import { useQuery } from "@tanstack/react-query";
import { get } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { GetUploadsResponse } from "@/types/projectScurve";

export const SCURVE_UPLOADS_QUERY_KEY = (projectId: string) =>
	["projects", projectId, "scurve", "uploads"] as const;

export const useScurveUploadsQuery = (projectId: string) => {
	return useQuery({
		queryKey: [...SCURVE_UPLOADS_QUERY_KEY(projectId)],
		enabled: Boolean(projectId),
		queryFn: async () => {
			const { OK, Kind } = await get<GetUploadsResponse>(
				MAIN_ENDPOINT.Projects.ScurveUploads(projectId),
			);

			if (!OK) {
				throw new Error("Failed to fetch upload history.");
			}

			const response = Kind as GetUploadsResponse;

			if (!response.success) {
				throw new Error(response.message || "Failed to fetch upload history.");
			}

			return response.data;
		},
	});
};
