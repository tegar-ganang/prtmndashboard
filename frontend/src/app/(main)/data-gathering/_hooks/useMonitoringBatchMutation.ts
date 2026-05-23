import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import { post } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { ApiResponse } from "@/types/api";

interface UseMonitoringBatchMutationProps {
	docType: string;
	onSuccess?: (response: { upload_batch_id: string }) => void;
}

export const useMonitoringBatchMutation = ({ docType, onSuccess }: UseMonitoringBatchMutationProps) => {
	return useMutation({
		mutationFn: async (data: any) => {
			let endpoint = MAIN_ENDPOINT.Mit.BatchCreate;
			if (docType === "HAZID") endpoint = MAIN_ENDPOINT.Hazid.BatchCreate;
			if (docType === "HAZOP") endpoint = MAIN_ENDPOINT.Hazop.BatchCreate;
			if (docType === "LOPA") endpoint = MAIN_ENDPOINT.Lopa.BatchCreate;

			const { Kind, OK } = await post<ApiResponse<{ upload_batch_id: string }>>(
				endpoint,
				data as unknown as Record<string, unknown>,
			);

			if (!OK) {
				const errorData = Kind as any;
				const errorMessage = errorData?.err || errorData?.message || errorData?.Message || `Telah terjadi kesalahan saat upload data ${docType}`;
				throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
			}

			const response = Kind as ApiResponse<{ upload_batch_id: string }>;
			
			if (!response.data) {
				throw new Error("Data response is empty");
			}

			return response.data;
		},
		onSuccess: (data) => {
			toast.success(`Berhasil mengunggah data ${docType}`);
			onSuccess?.(data);
		},
		onError: (error: any) => {
			toast.error(error?.message || `Gagal mengunggah data ${docType}`);
		},
	});
};
