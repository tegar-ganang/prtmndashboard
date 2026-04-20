"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { toast } from "react-hot-toast";
import Loading from "@/app/loading";
import useAuthStore from "@/app/stores/useAuthStore";
import { getToken, removeToken } from "@/lib/cookies";
import { get } from "@/services/api/main/call";
import { PATH } from "@/shared/path";
import type { ApiResponse } from "@/types/api";
import type { User } from "@/types/user";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";

export interface WithAuthProps {
	user: User;
}

export enum RouteType {
	public,
	protected,
}

/**
 * Add authentication to a component
 *
 * @see https://react-typescript-cheatsheet.netlify.app/docs/hoc/full_example/
 * @see https://github.com/mxthevs/nextjs-auth/blob/main/src/components/withAuth.tsx
 */
export default function withAuth<T>(
	Component: React.ComponentType<T>,
	routeType: keyof typeof RouteType
) {
	function ComponentWithAuth(props: T) {
		const router = useRouter();
		const params = useSearchParams();
		const redirect = params.get("redirect");
		const pathName = usePathname();

		//#region  //*=========== STORE ===========
		const isAuthenticated = useAuthStore.useIsAuthed();
		const isLoading = useAuthStore.useIsLoading();
		const hydrateUser = useAuthStore.useHydrateUser();
		const logout = useAuthStore.useLogout();
		const stopLoading = useAuthStore.useStopLoading();
		const user = useAuthStore.useUser();
		//#endregion  //*======== STORE ===========

		const checkAuth = React.useCallback(() => {
			const token = getToken();
			if (!token) {
				if (isAuthenticated) {
					logout();
				}
				stopLoading();
				return;
			}
			if (!user) {
				const loadUser = async () => {
					try {
						const { Kind, OK } =
							await get<ApiResponse<User>>(MAIN_ENDPOINT.Auth.CurrentUser);

						if (!OK) {
							toast.error("Sesi login tidak valid");
							throw new Error("Sesi login tidak valid");
						}

						const response = Kind as ApiResponse<User>;
						hydrateUser(response.data);
					} catch (_err) {
						await removeToken();
						logout();
					} finally {
						stopLoading();
					}
				};

				loadUser();
			} else {
				stopLoading();
			}
		}, [isAuthenticated, hydrateUser, logout, stopLoading, user]);

		React.useEffect(() => {
			if (isLoading && !user) {
				checkAuth();
			}

			window.addEventListener("focus", checkAuth);
			return () => {
				window.removeEventListener("focus", checkAuth);
			};
		}, [checkAuth, isLoading, user]);

		React.useEffect(() => {
			const handleRedirect = () => {
				if (isAuthenticated && user) {
					// Handle login route redirect
					if (pathName === PATH.LOGIN) {
						router.replace(PATH.HOME);
						return;
					}

					// Handle public route redirect
					if (routeType === "public") {
						if (redirect) {
							const nextPath = redirect.startsWith("/") ? redirect : PATH.HOME;
							router.replace(nextPath);
						} else {
							router.replace(PATH.HOME);
						}
					}
				} else if (routeType === "protected") {
					// Not authenticated and trying to access protected route
					router.replace(`${PATH.LOGIN}?redirect=${encodeURIComponent(pathName)}`);
				}
			};

			if (!isLoading) {
				handleRedirect();
			}
		}, [
			isAuthenticated,
			isLoading,
			pathName,
			redirect,
			router,
			user,
			routeType,
		]);

		// Show loading state if:
		// 1. Initial loading
		// 2. Not authenticated and trying to access protected route
		// 3. Authenticated but user data not yet loaded
		if (
			isLoading ||
			(!isAuthenticated && routeType === "protected") ||
			(isAuthenticated && !user)
		) {
			return <Loading />;
		}

		// Only render the component if:
		// 1. It's a public route
		// 2. User is authenticated (for protected routes)
		if (
			routeType === "public" ||
			(routeType === "protected" && isAuthenticated && user)
		) {
			return <Component {...(props as T)} user={user} />;
		}

		// Fallback loading state - this shouldn't normally be reached
		return <Loading />;
	}

	return ComponentWithAuth;
}
