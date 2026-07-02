import type { StylesConfig } from "react-select";

export type DocTypeValue = "MIT" | "HAZID" | "HAZOP" | "LOPA" | "MOC" | "HSSE" | "PRODUKSI" | "PRODUKSI_TARGET" | "PRODUKSI_REALISASI" | "ZONA_INDICATOR" | "ZONA_PSE_LIST";

export const DOC_TYPE_CONFIG: Record<DocTypeValue, {
	label: string;
	expectedHeaders: string[];
	glanceCols: string[];
	templateUrl: string;
	requiredFields: string[];
	period: "quarter" | "month";
}> = {
	MIT: {
		label: "Major Integrity Threat (MIT)",
		expectedHeaders: [
			"No Registration - Jenis MIT",
			"No Registration - Kategori", "No Registration - Tahun", "No Registration - No",
			"MIT Declaration Date", "MIT Title / Asset", "Integrity Threats",
			"Possible Scenario", "Consequences", "Available Safeguard/Control",
			"Current Risk - Likelihood", "Current Risk - Severity", "Current Risk - Risk",
			"Rec. No.", "Recommendation / Action", "PIC", "Target Closing", "Remarks",
			"Target Risk (After implemented Recommendation) - Likelihood",
			"Target Risk (After implemented Recommendation) - Severity",
			"Risk", "MIT Status", "Evidence", "Closing Date",
		],
		glanceCols: [
			"No Registration - No", "MIT Title / Asset",
			"Current Risk - Risk", "MIT Status", "PIC", "Target Closing",
		],
		templateUrl: "/templates/Template MIT Quartal.xlsx",
		requiredFields: ["MIT Title / Asset"],
		period: "quarter",
	},
	HAZID: {
		label: "Hazard Identification (HAZID)",
		expectedHeaders: [
			"NO.", "NODE NO", "REC. NO.", "NODE", "GUIDEWORD", "HAZARD", "CONSEQUENCES",
			"SAFEGUARD", "RECOMMENDATION", "LIKELIHOOD", "SEVERITY", "RISK",
			"RESPONSIBILITY/PIC", "TYPE", "TARGET DATE", "RESPONSE / PROGRESS",
			"CATEGORY", "SUB CATEGORY", "STATUS", "EVIDENCE", "COMPLETION DATE",
		],
		glanceCols: ["NODE", "HAZARD", "RISK", "STATUS", "RESPONSIBILITY/PIC"],
		templateUrl: "/templates/Template HAZID.xlsx",
		requiredFields: ["NODE"],
		period: "month",
	},
	HAZOP: {
		label: "Hazard and Operability Study (HAZOP)",
		expectedHeaders: [
			"NO.", "Rec. No.", "NODE NO", "REC. NO.", "NODE", "DEVIATION", "POSSIBLE CAUSE",
			"CONSEQUENCES", "SAFEGUARD", "RECOMMENDATION", "LIKELIHOOD", "SEVERITY",
			"RISK", "RESPONSIBILITY/PIC", "TYPE", "TARGET DATE", "RESPONSE / PROGRESS",
			"CATEGORY", "SUB CATEGORY", "STATUS", "EVIDENCE", "COMPLETION DATE", "SME",
		],
		glanceCols: ["NODE", "DEVIATION", "RISK", "STATUS", "RESPONSIBILITY/PIC"],
		templateUrl: "/templates/Template HAZOP.xlsx",
		requiredFields: ["NODE"],
		period: "month",
	},
	LOPA: {
		label: "Layer of Protection Analysis (LOPA)",
		expectedHeaders: [
			"NO.", "FUNCTION NO.", "FUNCTION NAME", "FUNCTION DESCRIPTION", "FINAL ELEMENT",
			"RECOMMENDATION", "RRF GAP VALUE", "RRF GAP TYPE", "RESPONSIBILITY/PIC",
			"TARGET DATE", "REMINDER STATUS", "RESPONSE / PROGRESS", "STATUS",
			"EVIDENCE", "COMPLETION DATE",
		],
		glanceCols: ["FUNCTION NAME", "FINAL ELEMENT", "RRF GAP VALUE", "STATUS", "RESPONSIBILITY/PIC"],
		templateUrl: "/templates/Template LOPA.xlsx",
		requiredFields: ["FUNCTION NAME"],
		period: "month",
	},
	MOC: {
		label: "Management of Change (MOC)",
		expectedHeaders: [
			"MOC_NUMBER", "CHANGE_DESC", "ISSUED_DATE", "FIELD", "DONE",
			"MOC_OWNER", "LAST_UPDATED", "ONGOING_STEP", "PIC", "STATUS",
		],
		glanceCols: ["MOC_NUMBER", "CHANGE_DESC", "STATUS", "PIC", "ISSUED_DATE"],
		templateUrl: "/templates/Template MOC.xlsx",
		requiredFields: ["MOC_NUMBER"],
		period: "month" as const,
	},
	HSSE: {
		label: "HSSE",

		expectedHeaders: [
			"ID_Izin", "Tanggal", "Bulan_Tahun", "Lokasi",
			"Jenis_Izin_Kerja", "Job_Complete", "Jumlah_ICC",
			"Status_Dispensasi", "Jenis_Deviasi", "Status_Deviasi",
			"Tingkat_Resiko",
		],
		glanceCols: ["ID_Izin", "Tanggal", "Lokasi", "Jenis_Izin_Kerja", "Tingkat_Resiko"],
		templateUrl: "/templates/Template Izin Kerja HSSE.xlsx",
		requiredFields: ["ID_Izin"],
		period: "month" as const,
	},
	PRODUKSI: {

		label: "Produksi Harian (Gas)",
		expectedHeaders: [], // Backend yang parse — tidak ada client-side header check
		glanceCols: [],
		templateUrl: "/templates/Template - Produksi.xlsx",
		requiredFields: [],
		period: "month" as const,
	},
	PRODUKSI_TARGET: {
		label: "Target Bulanan (Gas)",
		expectedHeaders: [],
		glanceCols: ["Bulan", "Target DMF (MMSCFD)"],
		templateUrl: "/templates/Template - Produksi.xlsx",
		requiredFields: [],
		period: "month" as const,
	},
	PRODUKSI_REALISASI: {
		label: "Realisasi Harian (Gas)",
		expectedHeaders: [],
		glanceCols: [
			"Tanggal",
			"PUPO/SOT Real (BOPD)",
			"Op Real (BOPD)",
			"Donggi Prod (MMSCFD)",
			"Matindok Prod (MMSCFD)",
			"Safe Man Hours",
			"Target DMF (MMSCFD)",
		],
		templateUrl: "/templates/Template - Produksi.xlsx",
		requiredFields: [],
		period: "month" as const,
	},
	ZONA_INDICATOR: {
		label: "PSAIMS — Zona Indicator",
		expectedHeaders: [
			"IND TYPE", "INDICATOR", "UNIT", "DESCRIPTION", "BASIS",
			"PIC Name", "PIC Email",
			"January", "February", "March", "April", "May", "June",
			"July", "August", "September", "October", "November", "December",
			"YTD", "Comment",
		],
		glanceCols: ["IND TYPE", "INDICATOR", "UNIT", "PIC Name", "January", "YTD"],
		templateUrl: "/templates/Template Zona Indicator.xlsx",
		requiredFields: ["INDICATOR"],
		period: "month" as const, // period not used — upload per year
	},
	ZONA_PSE_LIST: {
		label: "PSAIMS — Zona PSE List",
		expectedHeaders: [
			"NO", "ZONA", "FIELD / AREA", "LOKASI", "UNIT / DETAIL ",
			"SHORT DESCRIPTION", "EVENT ISSUE CATEGORY", "ACTIVITY",
			"TYPE LOCATION", "DATE START (DD/MM/YYYY)",
		],
		glanceCols: ["NO", "FIELD / AREA", "LOKASI", "SHORT DESCRIPTION", "PSE TIER", "DATE START (DD/MM/YYYY)"],
		templateUrl: "/templates/Template Zona PSE List.xlsx",
		requiredFields: ["NO"],
		period: "month" as const,
	},
};

export const DOCUMENT_OPTIONS = (Object.keys(DOC_TYPE_CONFIG) as DocTypeValue[])
	.filter((key) => key !== "PRODUKSI_TARGET" && key !== "PRODUKSI_REALISASI" && key !== "ZONA_INDICATOR" && key !== "ZONA_PSE_LIST")
	.map((key) => ({
		value: key,
		label: DOC_TYPE_CONFIG[key].label,
	}));

export const PSAIMS_OPTIONS = [
	{ value: "ZONA_INDICATOR" as DocTypeValue, label: "Zona Indicator" },
	{ value: "ZONA_PSE_LIST" as DocTypeValue, label: "Zona PSE List" },
];

export const QUARTER_OPTIONS = [
	{ value: "Q1", label: "Q1" },
	{ value: "Q2", label: "Q2" },
	{ value: "Q3", label: "Q3" },
	{ value: "Q4", label: "Q4" },
];

export const FIELD_OPTIONS = [
	{ value: "DONGGI", label: "Donggi" },
	{ value: "MATINDOK", label: "Matindok" },
];

export const MONTH_OPTIONS = [
	{ value: "1", label: "Januari" },
	{ value: "2", label: "Februari" },
	{ value: "3", label: "Maret" },
	{ value: "4", label: "April" },
	{ value: "5", label: "Mei" },
	{ value: "6", label: "Juni" },
	{ value: "7", label: "Juli" },
	{ value: "8", label: "Agustus" },
	{ value: "9", label: "September" },
	{ value: "10", label: "Oktober" },
	{ value: "11", label: "November" },
	{ value: "12", label: "Desember" },
];

const currentYear = new Date().getFullYear();
export const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => {
	const y = String(currentYear - 2 + i);
	return { value: y, label: y };
});

export const DRAWER_SECTIONS = [
	{ title: "Identitas & Registration", keys: ["No Registration - Jenis MIT", "No Registration - Kategori", "No Registration - Tahun", "No Registration - No"] },
	{ title: "Informasi MIT", keys: ["MIT Declaration Date", "MIT Title / Asset", "Integrity Threats", "Possible Scenario", "Consequences", "Available Safeguard/Control"] },
	{ title: "Current Risk", keys: ["Current Risk - Likelihood", "Current Risk - Severity", "Current Risk - Risk"] },
	{ title: "Rekomendasi", keys: ["Rec. No.", "Recommendation / Action", "PIC", "Target Closing", "Remarks"] },
	{ title: "Target Risk", keys: ["Target Risk (After implemented Recommendation) - Likelihood", "Target Risk (After implemented Recommendation) - Severity", "Risk"] },
	{ title: "Status & Evidence", keys: ["MIT Status", "Evidence", "Closing Date"] },
];

export const LONG_KEYS = new Set([
	"MIT Title / Asset",
	"Integrity Threats",
	"Possible Scenario",
	"Consequences",
	"Available Safeguard/Control",
	"Recommendation / Action",
	"Remarks",
	"Evidence",
]);

export const SELECT_STYLES: StylesConfig = {
	control: (base) => ({
		...base,
		borderColor: "#e5e7eb",
		borderRadius: "0.5rem",
		minHeight: "38px",
	}),
	menu: (base) => ({ ...base, zIndex: 50 }),
};
