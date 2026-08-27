import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import axiosInstance from "@/services/api/main/interceptor";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { UpdateAccountResponse } from "@/types/account";
import { ACCOUNTS_QUERY_KEY } from "./useAccountsQuery";

interface UpdateAccountStatusPayload {
	id: string;
	isActive: boolean;
}

export const useUpdateAccountStatusMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, isActive }: UpdateAccountStatusPayload) => {
			const { data } = await axiosInstance.patch<UpdateAccountResponse>(MAIN_ENDPOINT.Accounts.UpdateStatus(id), {
				is_active: isActive,
			});

			if (!data.success) {
				throw new Error(data.message || "Failed to update account status.");
			}

			return data;
		},
		onSuccess: (response) => {
			toast.success(response.message || "Status akun berhasil diperbarui.");
			queryClient.invalidateQueries({ queryKey: [...ACCOUNTS_QUERY_KEY] });
		},
		onError: (error: any) => {
			toast.error(error?.response?.data?.detail || error?.message || "Gagal memperbarui status akun.");
		},
	});
};
