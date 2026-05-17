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
	Mit: {
		BatchCreate: "/mit/batch",
		CheckPeriod: "/mit/check-period",
		GetAll: "/mit",
		History: "/mit/history",
	},
	Hazid: {
		BatchCreate: "/hazid/batch",
		CheckPeriod: "/hazid/check-period",
		GetAll: "/hazid",
		History: "/hazid/history",
	},
	Hazop: {
		BatchCreate: "/hazop/batch",
		CheckPeriod: "/hazop/check-period",
		GetAll: "/hazop",
		History: "/hazop/history",
	},
	Lopa: {
		BatchCreate: "/lopa/batch",
		CheckPeriod: "/lopa/check-period",
		GetAll: "/lopa",
		History: "/lopa/history",
	},
	Locations: {
		GetAll: "/locations",
	},
};
