import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/services/api/main/interceptor";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { AccountItem, GetAllAccountsResponse } from "@/types/account";

export const ACCOUNTS_QUERY_KEY = ["accounts"] as const;

export const useAccountsQuery = () => {
	return useQuery({
		queryKey: [...ACCOUNTS_QUERY_KEY],
		queryFn: async () => {
			const { data } = await axiosInstance.get<GetAllAccountsResponse>(MAIN_ENDPOINT.Accounts.GetAll);

			if (!data.success) {
				throw new Error(data.message || "Failed to fetch accounts.");
			}

			return data.data ?? ([] as AccountItem[]);
		},
	});
};
