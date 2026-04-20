import { createSelectorHooks } from "auto-zustand-selectors-hook";
import { produce } from "immer";
import { create } from "zustand";

import { removeToken, setToken } from "@/lib/cookies";
import type { User } from "@/types/user";
import { LoginResponse } from "@/types/login";

type AuthStoreType = {
	user: User | null;
	isAuthed: boolean;
	isLoading: boolean;
	login: (user: LoginResponse) => void;
	hydrateUser: (user: User) => void;
	logout: () => void;
	stopLoading: () => void;
};

const useAuthStoreBase = create<AuthStoreType>((set) => ({
	user: null,
	isAuthed: false,
	isLoading: true,
	login: (user) => {
		setToken(user.authorizedAccount.token);
		set(
			produce<AuthStoreType>((state) => {
				state.isAuthed = true;
				state.user = {
					id: user.authorizedAccount.email,
					name: user.authorizedAccount.name,
					email: user.authorizedAccount.email,
					is_verified: user.authorizedAccount.isVerified,
					is_active: user.authorizedAccount.isActive,
					is_logged_in: user.authorizedAccount.isLoggedIn,
					created_at: user.authorizedAccount.createdAt,
					updated_at: user.authorizedAccount.updatedAt,
				};
			}),
		);
	},
	hydrateUser: (user) => {
		set(
			produce<AuthStoreType>((state) => {
				state.isAuthed = true;
				state.user = user;
			}),
		);
	},
	logout: () => {
		removeToken();
		set(
			produce<AuthStoreType>((state) => {
				state.isAuthed = false;
				state.user = null;
			}),
		);
	},
	stopLoading: () => {
		set(
			produce<AuthStoreType>((state) => {
				state.isLoading = false;
			}),
		);
	},
}));

const useAuthStore = createSelectorHooks(useAuthStoreBase);

export default useAuthStore;
