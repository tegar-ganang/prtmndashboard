import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/lib/apiError";
import { upload } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { UploadScurveResponse } from "@/types/projectScurve";
import { SCURVE_PROGRESS_QUERY_KEY } from "./useScurveProgressQuery";
import { SCURVE_SUMMARY_QUERY_KEY } from "./useScurveSummaryQuery";
import { SCURVE_UPLOADS_QUERY_KEY } from "./useScurveUploadsQuery";

export const useUploadScurveMutation = (projectId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (file: File) => {
			const formData = new FormData();
			formData.append("file", file);

			const { OK, Kind, StatusCode } = await upload<UploadScurveResponse>(
				MAIN_ENDPOINT.Projects.ScurveUpload(projectId),
				formData,
			);

			if (!OK) {
				throw new Error(getApiErrorMessage(StatusCode, Kind, "Failed to upload S-Curve file."));
			}

			const response = Kind as UploadScurveResponse;

			if (!response.success) {
				throw new Error(response.message || "Failed to upload S-Curve file.");
			}

			return response;
		},
		onSuccess: (response) => {
			toast.success(response.message || "S-Curve uploaded successfully.");
			queryClient.invalidateQueries({ queryKey: [...SCURVE_PROGRESS_QUERY_KEY(projectId)] });
			queryClient.invalidateQueries({ queryKey: [...SCURVE_SUMMARY_QUERY_KEY(projectId)] });
			queryClient.invalidateQueries({ queryKey: [...SCURVE_UPLOADS_QUERY_KEY(projectId)] });
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to upload S-Curve file.");
		},
	});
};
