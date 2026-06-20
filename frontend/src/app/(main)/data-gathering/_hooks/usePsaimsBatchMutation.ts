import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import axiosInstance from "@/services/api/main/interceptor";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { DocTypeValue } from "../_constants/dataGathering.constants";

interface UsePsaimsBatchMutationProps {
	docType: DocTypeValue;
	onSuccess?: (response: { upload_batch_id: string }) => void;
}

export const usePsaimsBatchMutation = ({ docType, onSuccess }: UsePsaimsBatchMutationProps) => {
	return useMutation({
		mutationFn: async (data: any) => {
			const endpoint =
				docType === "ZONA_INDICATOR"
					? MAIN_ENDPOINT.ZonaIndicator.BatchCreate
					: MAIN_ENDPOINT.ZonaPseList.BatchCreate;

			const response = await axiosInstance.post(endpoint, data);

			if (!response.data?.success) {
				const errMsg =
					response.data?.err ||
					response.data?.message ||
					`Telah terjadi kesalahan saat upload data ${docType}`;
				throw new Error(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg));
			}

			const uploadData = response.data?.data;
			if (!uploadData) {
				throw new Error("Data response is empty");
			}
			return uploadData as { upload_batch_id: string };
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
