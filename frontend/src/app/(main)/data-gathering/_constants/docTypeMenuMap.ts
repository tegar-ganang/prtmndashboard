import type { MenuKey } from "@/configs/rbac";
import type { DocTypeValue } from "./dataGathering.constants";

/** Which RBAC menu governs upload permission for each doc type. */
export const DOC_TYPE_MENU: Record<DocTypeValue, MenuKey> = {
	MIT: "mit",
	HAZID: "hazid",
	HAZOP: "hazop",
	LOPA: "lopa",
	MOC: "moc",
	HSSE: "hsse",
	AIRMS: "airms",
	I2AIMS: "i2aims",
	LCV_PROJECT_CHARTER_BUDAYA: "lcv",
	LCV_MONITORING: "lcv",
	PRODUKSI: "produksi",
	PRODUKSI_TARGET: "produksi",
	PRODUKSI_REALISASI: "produksi",
	ZONA_INDICATOR: "zona_indicator",
	ZONA_PSE_LIST: "zona_pse_list",
};
