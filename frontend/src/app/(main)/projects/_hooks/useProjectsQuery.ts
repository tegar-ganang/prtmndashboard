import { useQuery } from "@tanstack/react-query";
import { get } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { GetAllProjectsResponse, ProjectItem } from "@/types/project";

export const PROJECTS_QUERY_KEY = ["projects"] as const;

export const useProjectsQuery = () => {
	return useQuery({
		queryKey: [...PROJECTS_QUERY_KEY],
		queryFn: async () => {
			const { OK, Kind } = await get<GetAllProjectsResponse>(
				MAIN_ENDPOINT.Projects.GetAll,
			);

			if (!OK) {
				throw new Error("Failed to fetch projects.");
			}

			const response = Kind as GetAllProjectsResponse;

			if (!response.success) {
				throw new Error(response.message || "Failed to fetch projects.");
			}

			return response.data ?? ([] as ProjectItem[]);
		},
	});
};
