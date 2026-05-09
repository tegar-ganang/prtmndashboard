import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import { post } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { ApiResponse } from "@/types/api";
import type { DocumentBatchCreate, MITResponse } from "@/types/mit";

interface UseMitBatchMutationProps {
	onSuccess?: (response: MITResponse) => void;
}

export const useMitBatchMutation = ({ onSuccess }: UseMitBatchMutationProps = {}) => {
	return useMutation({
		mutationFn: async (data: DocumentBatchCreate) => {
			const { Kind, OK } = await post<ApiResponse<MITResponse>>(
				MAIN_ENDPOINT.Mit.BatchCreate,
				data as unknown as Record<string, unknown>,
			);

			if (!OK) {
				const errorData = Kind as any;
				const errorMessage = errorData?.err || errorData?.message || "Telah terjadi kesalahan saat upload data MIT";
				throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
			}

			const response = Kind as ApiResponse<MITResponse>;
			
			if (!response.data) {
				throw new Error("Data response is empty");
			}

			return response.data;
		},
		onSuccess: (data) => {
			toast.success("Berhasil mengunggah data MIT Register");
			onSuccess?.(data);
		},
		onError: (error: any) => {
			toast.error(error?.message || "Gagal mengunggah data MIT Register");
		},
	});
};
