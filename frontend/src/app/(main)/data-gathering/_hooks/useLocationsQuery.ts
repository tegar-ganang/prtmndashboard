import { useQuery } from "@tanstack/react-query";
import { get } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { ApiResponse } from "@/types/api";

export interface LocationItem {
	id: string;
	code: string;
	name: string;
	description?: string;
}

export const LOCATIONS_QUERY_KEY = ["locations"] as const;

export const useLocationsQuery = () => {
	return useQuery({
		queryKey: [...LOCATIONS_QUERY_KEY],
		queryFn: async () => {
			const { OK, Kind } = await get<ApiResponse<LocationItem[]>>(
				MAIN_ENDPOINT.Locations.GetAll,
			);

			if (!OK) {
				throw new Error("Failed to fetch locations.");
			}

			const response = Kind as ApiResponse<LocationItem[]>;

			if (!response.status && response.err) {
				throw new Error(response.message || "Failed to fetch locations.");
			}

			return response.data ?? ([] as LocationItem[]);
		},
	});
};
