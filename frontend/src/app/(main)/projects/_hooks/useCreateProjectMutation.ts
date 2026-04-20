import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { post } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type {
	CreateProjectRequest,
	CreateProjectResponse,
} from "@/types/project";
import { toProjectPayload } from "../_lib/projectTransform";
import { PROJECTS_QUERY_KEY } from "./useProjectsQuery";

export const useCreateProjectMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: CreateProjectRequest) => {
			const { OK, Kind } = await post<CreateProjectResponse>(
				MAIN_ENDPOINT.Projects.Create,
				toProjectPayload(data) as unknown as Record<string, unknown>,
			);

			if (!OK) {
				throw new Error("Failed to create project.");
			}

			const response = Kind as CreateProjectResponse;

			if (!response.success) {
				throw new Error(response.message || "Failed to create project.");
			}

			return response;
		},
		onSuccess: (response) => {
			toast.success(response.message || "Project created successfully.");
			queryClient.invalidateQueries({ queryKey: [...PROJECTS_QUERY_KEY] });
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to create project.");
		},
	});
};
