import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import axiosInstance from "@/services/api/main/interceptor";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";

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
			if (docType === "MOC") endpoint = MAIN_ENDPOINT.Moc.BatchCreate;
			if (docType === "HSSE") endpoint = MAIN_ENDPOINT.Hsse.BatchCreate;


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
