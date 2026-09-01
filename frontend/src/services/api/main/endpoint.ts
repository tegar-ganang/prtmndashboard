export const MAIN_ENDPOINT = {
	Auth: {
		Login: "/auth/signin",
		CurrentUser: "/auth/me",
	},
	Accounts: {
		GetAll: "/accounts",
		Create: "/accounts",
		Roles: "/accounts/roles",
		DefaultPasswordHint: "/accounts/default-password-hint",
		UpdateRole: (id: string) => `/accounts/${id}/role`,
		UpdateStatus: (id: string) => `/accounts/${id}/status`,
		Update: (id: string) => `/accounts/${id}`,
		ChangeOwnPassword: "/accounts/me/password",
		Delete: "/accounts",
	},
	Projects: {
		GetAll: "/projects",
		Create: "/projects",
		Detail: (id: string) => `/projects/${id}`,
		Update: (id: string) => `/projects/${id}`,
		Delete: (id: string) => `/projects/${id}`,
		ScurveUpload: (id: string) => `/projects/${id}/scurve/upload`,
		ScurveProgress: (id: string) => `/projects/${id}/scurve/progress`,
		ScurveSummary: (id: string) => `/projects/${id}/scurve/summary`,
		ScurveUploads: (id: string) => `/projects/${id}/scurve/uploads`,
		ScurveDownload: (id: string, uploadId: string) =>
			`/projects/${id}/scurve/uploads/${uploadId}/download`,
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
	Airms: {
		BatchCreate: "/airms/batch",
		CheckPeriod: "/airms/check-period",
		GetAll: "/airms",
		History: "/airms/history",
	},
	I2aims: {
		BatchCreate: "/i2aims/batch",
		CheckPeriod: "/i2aims/check-period",
		GetAll: "/i2aims",
		History: "/i2aims/history",
	},
	Lcv: {
		BatchCreate: "/lcv/batch",
		CheckPeriod: "/lcv/check-period",
		GetAll: "/lcv",
		History: "/lcv/history",
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
