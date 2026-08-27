import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import axiosInstance from "@/services/api/main/interceptor";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import useAuthStore from "@/app/stores/useAuthStore";
import type { UpdateAccountResponse } from "@/types/account";

interface UpdateProfilePayload {
	id: string;
	name?: string;
}

export const useUpdateProfileMutation = () => {
	const hydrateUser = useAuthStore.useHydrateUser();

	return useMutation({
		mutationFn: async ({ id, name }: UpdateProfilePayload) => {
			const { data } = await axiosInstance.patch<UpdateAccountResponse>(
				MAIN_ENDPOINT.Accounts.Update(id),
				undefined,
				{ params: { update_name: name } },
			);

			if (!data.success) {
				throw new Error(data.message || "Failed to update profile.");
			}

			return data;
		},
		onSuccess: (response) => {
			toast.success(response.message || "Profil berhasil diperbarui.");
			const updated = response.data;
			hydrateUser({
				id: updated.id,
				name: updated.name ?? "",
				email: updated.email,
				role_name: updated.roleName,
				is_admin: updated.isAdmin,
				is_verified: updated.isVerified,
				is_active: updated.isActive,
				is_logged_in: updated.isLoggedIn,
				created_at: updated.createdAt,
				updated_at: updated.updatedAt,
			});
		},
		onError: (error: any) => {
			toast.error(error?.response?.data?.detail || error?.message || "Gagal memperbarui profil.");
		},
	});
};
