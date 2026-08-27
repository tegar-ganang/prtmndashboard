import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import axiosInstance from "@/services/api/main/interceptor";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { DeleteAccountResponse } from "@/types/account";
import { ACCOUNTS_QUERY_KEY } from "./useAccountsQuery";

export const useDeleteAccountMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const { data } = await axiosInstance.delete<DeleteAccountResponse>(MAIN_ENDPOINT.Accounts.Delete, {
				params: { id },
			});

			if (!data.success) {
				throw new Error(data.message || "Failed to delete account.");
			}

			return data;
		},
		onSuccess: (response) => {
			toast.success(response.message || "User berhasil dihapus.");
			queryClient.invalidateQueries({ queryKey: [...ACCOUNTS_QUERY_KEY] });
		},
		onError: (error: any) => {
			toast.error(error?.response?.data?.detail || error?.message || "Gagal menghapus user.");
		},
	});
};
