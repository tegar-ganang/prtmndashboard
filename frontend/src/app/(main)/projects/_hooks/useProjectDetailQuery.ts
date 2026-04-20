import { useQuery } from "@tanstack/react-query";
import { get } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { GetProjectDetailResponse } from "@/types/project";

export const PROJECT_DETAIL_QUERY_KEY = (id: string) =>
	["projects", "detail", id] as const;

export const useProjectDetailQuery = (id: string) => {
	return useQuery({
		queryKey: [...PROJECT_DETAIL_QUERY_KEY(id)],
		enabled: Boolean(id),
		queryFn: async () => {
			const { OK, Kind } = await get<GetProjectDetailResponse>(
				MAIN_ENDPOINT.Projects.Detail(id),
			);

			if (!OK) {
				throw new Error("Failed to fetch project detail.");
			}

			const response = Kind as GetProjectDetailResponse;

			if (!response.success) {
				throw new Error(response.message || "Failed to fetch project detail.");
			}

			return response.data;
		},
	});
};
