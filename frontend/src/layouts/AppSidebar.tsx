"use client";

import Tooltip from "@mui/material/Tooltip";
import {
	Barrel,
	Box,
	ChevronDown,
	ClipboardList,
	LayoutDashboard,
	Monitor,
	Settings,
	UploadCloud,
	Shield,
	User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import useAuthStore from "@/app/stores/useAuthStore";
import Button from "@/components/button/Button";
import { useSidebar } from "@/context/SidebarContext";
import axiosInstance from "@/services/api/main/interceptor";
import { canViewMenu, canUploadAnyMenu, type MenuKey } from "@/configs/rbac";

// Recursive: level 2..4 of the sidebar all use this shape.
type SubItem = {
	name: string;
	path?: string;
	description?: string;
	menu?: MenuKey;
	subItems?: SubItem[];
};

const DUMMY_ITEMS = new Set(["HSSE", "Project Charter Budaya", "LCV Monitoring", "AIRMS", "I2AIMS", "ABI", "ABO"]);
const PREFETCH_DOC: Record<string, string> = {
	Production: "produksi",
	HSSE: "hsse",
	"Project Charter Budaya": "lcv_project_charter_budaya",
	"LCV Monitoring": "lcv_monitoring",
	AIRMS: "airms",
	"Zona Indicator": "zona_indicator",
	"Zona PSE List": "zona_pse_list",
	I2AIMS: "i2aims",
	MIT: "mit",
	MOC: "moc",
};

// Keys of every group on the way to the item whose path is active.
const findActiveGroupKeys = (items: SubItem[], prefix: string, isActive: (p: string) => boolean): string[] | null => {
	for (const item of items) {
		const key = prefix ? `${prefix}-${item.name}` : item.name;
		if (item.path && isActive(item.path)) return [];
		if (item.subItems) {
			const found = findActiveGroupKeys(item.subItems, key, isActive);
			if (found) return [key, ...found];
		}
	}
	return null;
};

type NavItem = {
	name: string;
	icon: React.ReactNode;
	path?: string;
	description?: string;
	menu?: MenuKey;
	adminOnly?: boolean;
	subItems?: SubItem[];
};

const AppSidebar: React.FC = () => {
	const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
	const { user, logout: logoutFn } = useAuthStore();
	const router = useRouter();

	const pathname = usePathname();
	const queryClient = useQueryClient();

	const prefetchMonitoringData = (docType: string) => {
		const docTypeLower = docType.toLowerCase();
		let endpoint = docTypeLower;
		if (docTypeLower === "zona_indicator") endpoint = "zona-indicator";
		else if (docTypeLower === "zona_pse_list") endpoint = "zona-pse-list";
		else if (docTypeLower.startsWith("lcv_")) endpoint = "lcv";

		const params = {
			year: 2026,
			month: null,
			quarter: null,
			field: null,
			zona: null,
			doc_type: docTypeLower.startsWith("lcv_") ? docType.toUpperCase() : undefined
		};

		queryClient.prefetchQuery({
			queryKey: ["monitoring", docType, params],
			queryFn: async () => {
				const { data } = await axiosInstance.get(`/${endpoint}`, { params });
				return data.data;
			},
			staleTime: 3 * 60 * 1000,
		});
	};

	const prefetchDashboard = () => {
		const params = {
			year: 2026,
			month: null,
			field: null
		};
		queryClient.prefetchQuery({
			queryKey: ["dashboard-summary", params.year, params.month, params.field],
			queryFn: async () => {
				const { data } = await axiosInstance.get("/dashboard/summary", { params });
				return data.data;
			},
			staleTime: 3 * 60 * 1000,
		});
	};

	const navItems: NavItem[] = useMemo(
		() => [
			{
				icon: <LayoutDashboard className="w-5 h-5" />,
				name: "Dashboard",
				path: "/dashboard",
				description: "Lihat ringkasan dan performa terbaru.",
				menu: "dashboard",
			},
			{
				icon: <Box className="w-5 h-5" />,
				name: "Projects",
				path: "/projects",
				description: "Kelola proyek Anda secara efisien.",
				menu: "project",
			},
			{
				icon: <UploadCloud className="w-5 h-5" />,
				name: "Data Gathering",
				path: "/data-gathering",
				description: "Upload data menggunakan template Excel yang disediakan.",
				// Visible if the role can upload to at least one of the modules this hub covers.
				menu: undefined,
			},
			{
				icon: <Monitor className="w-5 h-5" />,
				name: "Monitoring",
				description: "Dashboard monitoring per dokumen.",
				subItems: [
					{
						name: "Production",
						path: "/monitoring/produksi",
						description: "Monitoring produksi gas harian Donggi-Matindok.",
						menu: "produksi",
					},
					{
						name: "OSF",
						description: "Operational Safety Frontline Monitoring.",
						subItems: [
							{ name: "AIRMS", path: "/monitoring/airms", description: "AIRMS Monitoring", menu: "airms" },
							{
								name: "PSAIMS",
								description: "PSAIMS Monitoring",
								subItems: [
									{ name: "Zona Indicator", path: "/monitoring/zona_indicator", menu: "zona_indicator" },
									{ name: "Zona PSE List", path: "/monitoring/zona_pse_list", menu: "zona_pse_list" },
								],
							},
							{ name: "I2AIMS", path: "/monitoring/i2aims", description: "I2AIMS Monitoring", menu: "i2aims" },
							{
								name: "MIT & MOC",
								description: "Major Integrity Threat & Management of Change",
								subItems: [
									{ name: "MIT", path: "/monitoring/mit", description: "Major Integrity Threat", menu: "mit" },
									{ name: "MOC", path: "/monitoring/moc", description: "Management of Change", menu: "moc" },
								],
							},
							{ name: "HAZID", path: "/monitoring/hazid", description: "HAZID Monitoring (Bulanan)", menu: "hazid" },
							{ name: "HAZOP", path: "/monitoring/hazop", description: "HAZOP Monitoring (Bulanan)", menu: "hazop" },
							{ name: "LOPA", path: "/monitoring/lopa", description: "LOPA Monitoring (Bulanan)", menu: "lopa" },
							{
								name: "OPE",
								description: "Operational Performance & Excellence",
								subItems: [
									{ name: "ABI", path: "/monitoring/abi", description: "Anggaran Biaya Investasi", menu: "abi" },
									{ name: "ABO", path: "/monitoring/abo", description: "Anggaran Biaya Operasi", menu: "abo" },
								],
							},
						],
					},
					{
						name: "HSSE",
						path: "/monitoring/hsse",
						description: "HSSE Monitoring.",
						menu: "hsse",
					},
					{
						name: "LCV",
						description: "Loss Control & Verification Monitoring.",
						subItems: [
							{ name: "Project Charter Budaya", path: "/monitoring/lcv_project_charter_budaya", menu: "lcv" },
							{ name: "LCV Monitoring", path: "/monitoring/lcv_monitoring", menu: "lcv" },
						],
					},
				],
			},
			{
				icon: <Settings className="w-5 h-5" />,
				name: "User Management",
				path: "/admin-users",
				description: "Kelola role akses pengguna dashboard.",
				adminOnly: true,
			},
			{
				icon: <ClipboardList className="w-5 h-5" />,
				name: "Log Data",
				path: "/log-data",
				description: "Cek status sinkronisasi data ke mart_pertamina.",
				adminOnly: true,
			},
		],
		[],
	);

	const roleName = user?.role_name;
	const isAdmin = user?.is_admin ?? false;
	const dataGatheringMenus: MenuKey[] = [
		"produksi", "i2aims", "airms", "mit", "moc", "hazid", "hazop", "lopa",
		"hsse", "lcv", "zona_indicator", "zona_pse_list", "abi", "abo",
	];

	const filterSubItems = useCallback(
		function filter(items: SubItem[]): SubItem[] {
			return items
				.map((item) => (item.subItems ? { ...item, subItems: filter(item.subItems) } : item))
				.filter((item) => (item.subItems ? item.subItems.length > 0 : !item.menu || canViewMenu(roleName, item.menu)));
		},
		[roleName],
	);

	const filterNavItems = useCallback(
		(items: NavItem[]): NavItem[] =>
			items
				.filter((item) => {
					if (item.adminOnly) return isAdmin;
					if (item.name === "Data Gathering") return canUploadAnyMenu(roleName, dataGatheringMenus);
					if (item.menu) return canViewMenu(roleName, item.menu);
					return true; // no menu tag (e.g. "Monitoring" group, "OPE") — let sub-items decide
				})
				.map((item) => (item.subItems ? { ...item, subItems: filterSubItems(item.subItems) } : item))
				.filter((item) => !item.subItems || item.subItems.length > 0),
		// biome-ignore lint/correctness/useExhaustiveDependencies: dataGatheringMenus is a stable literal
		[roleName, isAdmin, filterSubItems],
	);

	const filteredNavItems = filterNavItems(navItems);

	// Keyed by name path (e.g. "Monitoring-OSF-OPE"), not index — indices shift once items are role-filtered.
	// Groups only close when the user clicks them; navigating just opens the active branch.
	const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());

	const isActive = useCallback(
		(path: string) => pathname.includes(path),
		[pathname],
	);

	const toggleKey = (key: string) => {
		setOpenKeys((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	};

	useEffect(() => {
		const keys = findActiveGroupKeys(navItems, "", isActive);
		if (keys?.length) setOpenKeys((prev) => new Set([...prev, ...keys]));
	}, [isActive, navItems]);

	// Level 2..4 items, rendered recursively.
	const renderSubItems = (items: SubItem[], parentKey: string, depth: number): React.ReactNode =>
		items.map((item) => {
			const key = `${parentKey}-${item.name}`;
			const textSize = depth === 2 ? "text-base py-2" : "text-sm py-1.5";

			if (item.subItems && item.subItems.length > 0) {
				const isOpen = openKeys.has(key);
				return (
					<li key={item.name} className="flex flex-col">
						<button
							type="button"
							onClick={() => toggleKey(key)}
							className={`relative flex items-center w-full gap-3 px-3 ${textSize} font-medium rounded-lg transition-all ease-in-out duration-300 text-white/90 hover:bg-white/10 group cursor-pointer`}
						>
							<span className="flex-1 text-left">{item.name}</span>
							<ChevronDown
								className={`w-4 h-4 transition-transform ease-in-out duration-300 text-white/90 ${isOpen ? "rotate-180" : ""}`}
							/>
						</button>
						<div
							className={`overflow-hidden transition-all duration-300 ease-in-out ${
								isOpen ? "max-h-[800px] opacity-100 mt-1" : "max-h-0 opacity-0 pointer-events-none"
							}`}
						>
							<ul className="space-y-1 ml-4 border-l border-white/20 pl-3">
								{renderSubItems(item.subItems, key, depth + 1)}
							</ul>
						</div>
					</li>
				);
			}

			if (!item.path) return null;
			const active = isActive(item.path);
			return (
				<li key={item.name}>
					<Tooltip title={item.description} placement="right" arrow>
						<Link
							href={item.path}
							onMouseEnter={() => {
								const doc = PREFETCH_DOC[item.name];
								if (doc) prefetchMonitoringData(doc);
							}}
							className={`relative flex items-center gap-3 rounded-lg px-3 ${textSize} font-medium transition-all ease-in-out duration-300 ${
								active ? "bg-white text-[#1E3A8A] hover:bg-white/95" : "text-white/85 hover:bg-white/10 hover:text-white"
							}`}
						>
							<span className="flex-1">{item.name}</span>
							{DUMMY_ITEMS.has(item.name) && (
								<span
									className={`text-[9px] font-extrabold px-1 py-0.5 rounded uppercase border whitespace-nowrap tracking-wider ${
										active
											? "bg-amber-100 text-amber-800 border-amber-200"
											: "bg-amber-500/20 text-[#fbbf24] border-amber-500/30"
									}`}
								>
									Dummy
								</span>
							)}
						</Link>
					</Tooltip>
				</li>
			);
		});

	const renderMenuItems = (navItems: NavItem[]) => (
		<ul className="flex flex-col gap-2">
			{navItems.map((nav) => (
				<li key={nav.name}>
					{nav.subItems && nav.subItems.length > 0 ? (
						<button
							type="button"
							onClick={() => toggleKey(nav.name)}
							className={`relative flex items-center w-full gap-3 ${
								(isExpanded || isHovered || isMobileOpen) && "px-3 py-2"
							} font-medium rounded-lg group transition-all ease-in-out duration-300 text-white/90 hover:bg-white/10 group-hover:text-white cursor-pointer ${
								!isExpanded && !isHovered
									? "lg:justify-center"
									: "lg:justify-start"
							}`}
						>
							<span
								className={`transition-all ease-in-out duration-300 text-white/90 group-hover:text-white ${
									!(isExpanded || isHovered || isMobileOpen) &&
									"aspect-square p-2 flex justify-center items-center mx-auto"
								}`}
							>
								{nav.icon}
							</span>
							{(isExpanded || isHovered || isMobileOpen) && (
								<span
									className="menu-item-text transition-all ease-in-out duration-300 group-hover:text-white"
								>
									{nav.name}
								</span>
							)}
							{(isExpanded || isHovered || isMobileOpen) && (
								<ChevronDown
									className={`ml-auto w-5 h-5 transition-transform ease-in-out duration-300 text-white/90 ${
										openKeys.has(nav.name)
											? "rotate-180"
											: ""
									}`}
								/>
							)}
						</button>
					) : (
						nav.path && (
							<Tooltip title={nav.description} placement="right" arrow>
								<Link
									href={nav.path}
									onMouseEnter={() => {
										if (nav.path === "/dashboard") prefetchDashboard();
										else if (nav.path === "/monitoring/produksi") prefetchMonitoringData("produksi");
										else if (nav.path === "/monitoring/hsse") prefetchMonitoringData("hsse");
																			}}
									className={`relative flex items-center w-full gap-3 ${
										(isExpanded || isHovered || isMobileOpen) && "px-3 py-2"
									} font-medium rounded-lg text-base group transition-all ease-in-out duration-300 ${
										isActive(nav.path)
											? "bg-white text-[#1E3A8A] hover:bg-white/95"
											: "text-white/90 hover:bg-white/10 hover:text-white"
									}`}
								>
									<span
										className={`transition-all ease-in-out duration-300 ${
											isActive(nav.path)
												? "text-[#1E3A8A]"
												: "text-white/90 group-hover:text-white"
										} ${
											!(isExpanded || isHovered || isMobileOpen) &&
											"aspect-square p-2 flex justify-center items-center mx-auto"
										}`}
									>
										{nav.icon}
									</span>
									{(isExpanded || isHovered || isMobileOpen) && (
										<div className="flex items-center justify-between w-full min-w-0">
											<span
												className={`menu-item-text transition-all ease-in-out duration-300 ${
													isActive(nav.path)
														? "text-[#1E3A8A]"
														: "group-hover:text-white"
												}`}
											>
												{nav.name}
											</span>
										</div>
									)}
								</Link>
							</Tooltip>
						)
					)}
					{nav.subItems && nav.subItems.length > 0 && (isExpanded || isHovered || isMobileOpen) && (
						<div
							className={`overflow-hidden transition-all duration-300 ease-in-out ${
								openKeys.has(nav.name)
									? "max-h-[1200px] opacity-100 mt-2"
									: "max-h-0 opacity-0 pointer-events-none"
							}`}
						>
							<ul className="space-y-1 ml-9">
								{renderSubItems(nav.subItems, nav.name, 2)}
							</ul>
						</div>
					)}
				</li>
			))}
		</ul>
	);

	return (
		<aside
			className={`fixed flex flex-col p-6 bg-[#1E3A8A] text-white ${
				isMobileOpen ? "h-[calc(100vh-67px)]" : "h-screen"
			} transition-all justify-between duration-300 ease-in-out z-999 border-r border-[#1E3A8A]
        ${isExpanded || isMobileOpen ? "w-70" : isHovered ? "w-70" : "w-22.5"}
			${isMobileOpen ? "translate-x-0 mt-16.75" : "-translate-x-full"}
        lg:translate-x-0`}
			onMouseEnter={() => !isExpanded && setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<div
				className={`flex items-center gap-2 ${
					!isExpanded && !isHovered
						? "lg:justify-center mb-8"
						: "justify-start mb-8"
				}`}
			>
				<Link
					href="/"
					className={`flex items-center justify-center bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 ${
						isExpanded || isHovered || isMobileOpen ? "p-3 w-full" : "p-1.5 w-12 h-12"
					}`}
				>
					<Image
						src={
							isExpanded || isHovered || isMobileOpen
								? "/PertaminaLogo.png"
								: "/PertaminaLogoSmall.png"
						}
						alt="Pertamina Logo"
						width={160}
						height={40}
						className="rounded-lg object-contain"
						priority
					/>
				</Link>
			</div>
			<div className="flex-1 flex flex-col overflow-x-hidden overflow-y-auto duration-300 ease-linear no-scrollbar mb-4 min-h-0">
				<nav className="mb-6">
					<div className="flex flex-col gap-4">
						<div>{renderMenuItems(filteredNavItems)}</div>
					</div>
				</nav>
			</div>
			<div className="mt-auto pt-4 border-t border-white/20">
				<button
					type="button"
					className={`w-full flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-3 py-3 text-left transition-all duration-200 hover:bg-white/20 ${
						!isExpanded && !isHovered && !isMobileOpen ? "justify-center" : ""
					}`}
					onClick={() => router.push("/profile")}
					aria-label="Profile"
				>
					<div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
						<User className="w-5 h-5 text-white" />
					</div>

					{(isExpanded || isHovered || isMobileOpen) && (
						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-semibold text-white">
								{user?.name || "Tegar Priambodo"}
							</p>
							<p className="truncate text-xs text-white/70">Profile</p>
						</div>
					)}
				</button>

				<button
					onClick={() => {
						logoutFn();
						router.push("/login");
					}}
					type="button"
					className={`mt-3 w-full flex items-center justify-center rounded-lg bg-[#E30613] hover:bg-[#C50510] active:bg-[#A8040C] px-3 py-2 text-sm font-semibold text-white transition-all duration-200 cursor-pointer ${
						!isExpanded && !isHovered && !isMobileOpen ? "px-0" : ""
					}`}
				>
					{isExpanded || isHovered || isMobileOpen ? "Logout" : "L"}
				</button>
			</div>
		</aside>
	);
};

export default AppSidebar;
