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
	| "zona_pse_list"
	| "abi"
	| "abo";

type MenuAccess = { view: boolean; upload: boolean };

const ALL_MENUS: MenuKey[] = [
	"dashboard", "produksi", "project", "hsse", "lcv", "i2aims", "airms",
	"mit", "moc", "hazid", "hazop", "lopa", "location", "zona_indicator", "zona_pse_list",
	"abi", "abo",
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
		abi: edit,
		abo: edit,
	},
	"Project Manager": {
		dashboard: view,
		project: edit,
		location: view,
	},
	"HSSE & Admin": {
		dashboard: view,
		hsse: edit,
		lcv: edit,
	},
};

type RbacUser = { role_name?: string | null; is_admin?: boolean } | null | undefined;

// Admins (is_admin) bypass the role matrix — mirrors require_menu_access in backend/src/api/dependencies/rbac.py.
export function canViewMenu(user: RbacUser, menu: MenuKey): boolean {
	if (user?.is_admin) return true;
	if (!user?.role_name) return false;
	return Boolean(ROLE_MENU_ACCESS[user.role_name]?.[menu]?.view);
}

export function canUploadMenu(user: RbacUser, menu: MenuKey): boolean {
	if (user?.is_admin) return true;
	if (!user?.role_name) return false;
	return Boolean(ROLE_MENU_ACCESS[user.role_name]?.[menu]?.upload);
}

export function canViewAnyMenu(user: RbacUser, menus: MenuKey[]): boolean {
	return menus.some((menu) => canViewMenu(user, menu));
}

export function canUploadAnyMenu(user: RbacUser, menus: MenuKey[]): boolean {
	return menus.some((menu) => canUploadMenu(user, menu));
}
