import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import axiosInstance from "@/services/api/main/interceptor";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { UpdateAccountRoleResponse } from "@/types/account";
import { ACCOUNTS_QUERY_KEY } from "./useAccountsQuery";

interface UpdateAccountRolePayload {
	id: string;
	roleId: number | null;
}

export const useUpdateAccountRoleMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, roleId }: UpdateAccountRolePayload) => {
			const { data } = await axiosInstance.patch<UpdateAccountRoleResponse>(
				MAIN_ENDPOINT.Accounts.UpdateRole(id),
				{ role_id: roleId },
			);

			if (!data.success) {
				throw new Error(data.message || "Failed to update account role.");
			}

			return data;
		},
		onSuccess: (response) => {
			toast.success(response.message || "Role berhasil diperbarui.");
			queryClient.invalidateQueries({ queryKey: [...ACCOUNTS_QUERY_KEY] });
		},
		onError: (error: any) => {
			toast.error(error?.message || "Gagal memperbarui role.");
		},
	});
};
