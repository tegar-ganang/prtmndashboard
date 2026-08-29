import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import axiosInstance from "@/services/api/main/interceptor";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { UpdateAccountRequest, UpdateAccountResponse } from "@/types/account";
import { ACCOUNTS_QUERY_KEY } from "./useAccountsQuery";

interface EditAccountPayload extends UpdateAccountRequest {
	id: string;
}

export const useEditAccountMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, name, email }: EditAccountPayload) => {
			// Backend expects these as query params, not a JSON body.
			const { data } = await axiosInstance.patch<UpdateAccountResponse>(
				MAIN_ENDPOINT.Accounts.Update(id),
				undefined,
				{ params: { update_name: name, update_email: email } },
			);

			if (!data.success) {
				throw new Error(data.message || "Failed to update account.");
			}

			return data;
		},
		onSuccess: (response) => {
			toast.success(response.message || "User berhasil diperbarui.");
			queryClient.invalidateQueries({ queryKey: [...ACCOUNTS_QUERY_KEY] });
		},
		onError: (error: any) => {
			toast.error(error?.response?.data?.detail || error?.message || "Gagal memperbarui user.");
		},
	});
};
