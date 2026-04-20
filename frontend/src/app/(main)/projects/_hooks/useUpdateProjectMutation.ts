import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { patch } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { CreateProjectRequest, UpdateProjectResponse } from "@/types/project";
import { toProjectPayload } from "../_lib/projectTransform";
import { PROJECT_DETAIL_QUERY_KEY } from "./useProjectDetailQuery";
import { PROJECTS_QUERY_KEY } from "./useProjectsQuery";

export const useUpdateProjectMutation = (id: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: CreateProjectRequest) => {
			const { OK, Kind } = await patch<UpdateProjectResponse>(
				MAIN_ENDPOINT.Projects.Update(id),
				toProjectPayload(data) as unknown as Record<string, unknown>,
			);

			if (!OK) {
				throw new Error("Failed to update project.");
			}

			const response = Kind as UpdateProjectResponse;

			if (!response.success) {
				throw new Error(response.message || "Failed to update project.");
			}

			return response;
		},
		onSuccess: (response) => {
			toast.success(response.message || "Project updated successfully.");
			queryClient.invalidateQueries({ queryKey: [...PROJECTS_QUERY_KEY] });
			queryClient.invalidateQueries({ queryKey: [...PROJECT_DETAIL_QUERY_KEY(id)] });
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to update project.");
		},
	});
};
