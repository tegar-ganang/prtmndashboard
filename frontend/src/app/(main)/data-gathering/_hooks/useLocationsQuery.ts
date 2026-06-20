import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/services/api/main/interceptor";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";

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
			const response = await axiosInstance.get(MAIN_ENDPOINT.Locations.GetAll);

			if (!response.data?.success) {
				throw new Error(response.data?.message || "Failed to fetch locations.");
			}

			return (response.data?.data ?? []) as LocationItem[];
		},
	});
};
