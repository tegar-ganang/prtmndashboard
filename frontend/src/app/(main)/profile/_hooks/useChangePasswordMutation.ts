import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import axiosInstance from "@/services/api/main/interceptor";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { ChangePasswordRequest, ChangePasswordResponse } from "@/types/account";

export const useChangePasswordMutation = () => {
	return useMutation({
		mutationFn: async (payload: ChangePasswordRequest) => {
			const { data } = await axiosInstance.patch<ChangePasswordResponse>(MAIN_ENDPOINT.Accounts.ChangeOwnPassword, {
				current_password: payload.currentPassword,
				new_password: payload.newPassword,
			});

			if (!data.success) {
				throw new Error(data.message || "Failed to change password.");
			}

			return data;
		},
		onSuccess: (response) => {
			toast.success(response.message || "Password berhasil diubah.");
		},
		onError: (error: any) => {
			toast.error(error?.response?.data?.detail || error?.message || "Gagal mengubah password.");
		},
	});
};
