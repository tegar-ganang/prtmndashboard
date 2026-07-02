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
	Moc: {
		BatchCreate: "/moc/batch",
		CheckPeriod: "/moc/check-period",
		GetAll: "/moc",
		History: "/moc/history",
	},
	Hsse: {
		BatchCreate: "/hsse/batch",
		CheckPeriod: "/hsse/check-period",
		GetAll: "/hsse",
		History: "/hsse/history",
	},

	Produksi: {
		Upload: "/produksi/upload-excel",
		CheckPeriod: "/produksi/check-period",
		GetAll: "/produksi",
		History: "/produksi/history",
	},
	Locations: {
		GetAll: "/locations",
	},
	ZonaIndicator: {
		BatchCreate: "/zona-indicator/batch",
		CheckPeriod: "/zona-indicator/check-period",
		GetAll: "/zona-indicator",
		History: "/zona-indicator/history",
	},
	ZonaPseList: {
		BatchCreate: "/zona-pse-list/batch",
		CheckPeriod: "/zona-pse-list/check-period",
		GetAll: "/zona-pse-list",
		History: "/zona-pse-list/history",
	},
};
