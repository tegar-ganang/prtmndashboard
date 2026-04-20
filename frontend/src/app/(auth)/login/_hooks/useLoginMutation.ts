import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import useAuthStore from "@/app/stores/useAuthStore";
import { PATH } from "@/shared/path";
import { post } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { ApiResponse } from "@/types/api";
import type { LoginRequest, LoginResponse } from "@/types/login";

interface UseLoginMutationProps {
	onSuccess?: () => void;
}

export const useLoginMutation = ({ onSuccess }: UseLoginMutationProps = {}) => {
	const searchParams = useSearchParams();
	const router = useRouter();
	const redirect = searchParams.get("redirect") || PATH.HOME;
	const safeRedirect = redirect.startsWith("/") && redirect !== PATH.LOGIN ? redirect : PATH.HOME;

	const { login } = useAuthStore();

	return useMutation({
		mutationFn: async (data: LoginRequest) => {
			const { Kind, OK } = await post<ApiResponse<LoginResponse>>(
				MAIN_ENDPOINT.Auth.Login,
				data as unknown as Record<string, unknown>,
			);

			if (!OK) {
				throw new Error(
					(Kind as ApiResponse<LoginResponse>)?.err ??
						"Tidak berhasil masuk. Mohon coba lagi.",
				);
			}

			const response = Kind as ApiResponse<LoginResponse>;

			return response.data;
		},
		onSuccess: (data) => {
			login(data);
			toast.success("Berhasil masuk ke dalam sistem.");
			onSuccess?.();
			router.replace(safeRedirect);
		},
		onError: (error: Error) => {
			toast.error(error.message || "Tidak berhasil masuk. Mohon coba lagi.");
		},
	});
};
