import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import axiosInstance from "@/services/api/main/interceptor";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { CreateAccountRequest, CreateAccountResponse } from "@/types/account";
import { ACCOUNTS_QUERY_KEY } from "./useAccountsQuery";

export const useCreateAccountMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (payload: CreateAccountRequest) => {
			const { data } = await axiosInstance.post<CreateAccountResponse>(MAIN_ENDPOINT.Accounts.Create, {
				email: payload.email,
				name: payload.name,
				role_id: payload.roleId,
			});

			if (!data.success) {
				throw new Error(data.message || "Failed to create account.");
			}

			return data;
		},
		onSuccess: (response) => {
			toast.success(response.message || "User berhasil dibuat.");
			queryClient.invalidateQueries({ queryKey: [...ACCOUNTS_QUERY_KEY] });
		},
		onError: (error: any) => {
			toast.error(error?.response?.data?.detail || error?.message || "Gagal membuat user.");
		},
	});
};
