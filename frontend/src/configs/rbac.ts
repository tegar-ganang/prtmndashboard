/**
 * Mirrors the role/menu access matrix seeded in the backend
 * (backend/src/repository/seed_rbac.py), built from
 * "RENCANA PENGUJIAN INTERNAL ITS.docx". Keep the two in sync.
 */
export type MenuKey =
	| "dashboard"
	| "produksi"
	| "project"
	| "hsse"
	| "lcv"
	| "i2aims"
	| "airms"
	| "mit"
	| "moc"
	| "hazid"
	| "hazop"
	| "lopa"
	| "location"
	| "zona_indicator"
	| "zona_pse_list";

type MenuAccess = { view: boolean; upload: boolean };

const ALL_MENUS: MenuKey[] = [
	"dashboard", "produksi", "project", "hsse", "lcv", "i2aims", "airms",
	"mit", "moc", "hazid", "hazop", "lopa", "location", "zona_indicator", "zona_pse_list",
];

const view: MenuAccess = { view: true, upload: false };
const edit: MenuAccess = { view: true, upload: true };

export const ROLE_MENU_ACCESS: Record<string, Partial<Record<MenuKey, MenuAccess>>> = {
	"Executive": Object.fromEntries(ALL_MENUS.map((m) => [m, view])), // cross-module consolidated view only
	"Production Manager": {
		dashboard: view,
		produksi: edit,
		location: view,
		zona_indicator: view,
		zona_pse_list: view,
	},
	"OSF Engineer": {
		dashboard: view,
		i2aims: edit,
		airms: edit,
		mit: edit,
		moc: edit,
		hazid: edit,
		hazop: edit,
		lopa: edit,
		zona_indicator: edit,
		zona_pse_list: edit,
		location: view,
	},
	"Project Manager": {
		dashboard: view,
		project: edit,
	},
	"HSSE & Admin": {
		dashboard: view,
		hsse: edit,
		lcv: edit,
	},
};

export function canViewMenu(roleName: string | null | undefined, menu: MenuKey): boolean {
	if (!roleName) return false;
	return Boolean(ROLE_MENU_ACCESS[roleName]?.[menu]?.view);
}

export function canUploadMenu(roleName: string | null | undefined, menu: MenuKey): boolean {
	if (!roleName) return false;
	return Boolean(ROLE_MENU_ACCESS[roleName]?.[menu]?.upload);
}

export function canViewAnyMenu(roleName: string | null | undefined, menus: MenuKey[]): boolean {
	return menus.some((menu) => canViewMenu(roleName, menu));
}

export function canUploadAnyMenu(roleName: string | null | undefined, menus: MenuKey[]): boolean {
	return menus.some((menu) => canUploadMenu(roleName, menu));
}
