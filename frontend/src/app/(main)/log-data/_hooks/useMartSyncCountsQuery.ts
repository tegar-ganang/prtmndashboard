import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/services/api/main/interceptor";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { GetMartSyncCountsResponse, MartSyncCountRow } from "@/types/martSync";

export const MART_SYNC_COUNTS_QUERY_KEY = ["mart-sync-counts"] as const;

export const useMartSyncCountsQuery = () => {
	return useQuery({
		queryKey: [...MART_SYNC_COUNTS_QUERY_KEY],
		queryFn: async () => {
			const { data } = await axiosInstance.get<GetMartSyncCountsResponse>(MAIN_ENDPOINT.MartSync.Counts);

			if (!data.success) {
				throw new Error(data.message || "Failed to fetch table counts.");
			}

			return data.data ?? ([] as MartSyncCountRow[]);
		},
	});
};
