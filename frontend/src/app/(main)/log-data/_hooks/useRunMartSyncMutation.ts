import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import axiosInstance from "@/services/api/main/interceptor";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { RunMartSyncResponse } from "@/types/martSync";
import { MART_SYNC_COUNTS_QUERY_KEY } from "./useMartSyncCountsQuery";

export const useRunMartSyncMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			const { data } = await axiosInstance.post<RunMartSyncResponse>(MAIN_ENDPOINT.MartSync.Run);
			return data;
		},
		onSuccess: (response) => {
			const failed = response.data?.filter((r) => !r.success) ?? [];
			if (failed.length === 0) {
				toast.success(response.message || "Semua script berhasil dijalankan.");
			} else {
				toast.error(`${failed.length} dari ${response.data.length} script gagal dijalankan.`);
			}
			queryClient.invalidateQueries({ queryKey: [...MART_SYNC_COUNTS_QUERY_KEY] });
		},
		onError: (error: any) => {
			toast.error(error?.response?.data?.detail || error?.message || "Gagal menjalankan sync data.");
		},
	});
};
