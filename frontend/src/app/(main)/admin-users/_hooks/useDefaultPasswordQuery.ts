import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/services/api/main/interceptor";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { DefaultPasswordHintResponse } from "@/types/account";

export const useDefaultPasswordQuery = () => {
	return useQuery({
		queryKey: ["default-password-hint"],
		queryFn: async () => {
			const { data } = await axiosInstance.get<DefaultPasswordHintResponse>(
				MAIN_ENDPOINT.Accounts.DefaultPasswordHint,
			);

			if (!data.success) {
				throw new Error(data.message || "Failed to fetch default password.");
			}

			return data.data.default_password;
		},
		staleTime: Infinity,
	});
};
