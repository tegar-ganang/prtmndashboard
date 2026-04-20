export const MAIN_ENDPOINT = {
	Auth: {
		Login: "/auth/signin",
		CurrentUser: "/auth/me",
	},
	Projects: {
		GetAll: "/projects",
		Create: "/projects",
		Detail: (id: string) => `/projects/${id}`,
		Update: (id: string) => `/projects/${id}`,
		Delete: (id: string) => `/projects/${id}`,
	},
};
