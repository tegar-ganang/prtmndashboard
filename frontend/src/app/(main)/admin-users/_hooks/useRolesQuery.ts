import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/services/api/main/interceptor";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { GetAllRolesResponse, RoleItem } from "@/types/account";

export const ROLES_QUERY_KEY = ["roles"] as const;

export const useRolesQuery = () => {
	return useQuery({
		queryKey: [...ROLES_QUERY_KEY],
		queryFn: async () => {
			const { data } = await axiosInstance.get<GetAllRolesResponse>(MAIN_ENDPOINT.Accounts.Roles);

			if (!data.success) {
				throw new Error(data.message || "Failed to fetch roles.");
			}

			return data.data ?? ([] as RoleItem[]);
		},
	});
};
