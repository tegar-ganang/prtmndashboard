import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { del } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { DeleteProjectResponse } from "@/types/project";
import { PROJECTS_QUERY_KEY } from "./useProjectsQuery";

export const useDeleteProjectMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const { OK, Kind } = await del<DeleteProjectResponse>(
				MAIN_ENDPOINT.Projects.Delete(id),
			);

			if (!OK) {
				throw new Error("Failed to delete project.");
			}

			const response = Kind as DeleteProjectResponse;

			if (!response.success) {
				throw new Error(response.message || "Failed to delete project.");
			}

			return response;
		},
		onSuccess: (response) => {
			toast.success(response.message || "Project deleted successfully.");
			queryClient.invalidateQueries({ queryKey: [...PROJECTS_QUERY_KEY] });
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to delete project.");
		},
	});
};
