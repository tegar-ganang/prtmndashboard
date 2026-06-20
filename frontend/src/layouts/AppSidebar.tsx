"use client";

import Tooltip from "@mui/material/Tooltip";
import {
	Barrel,
	Box,
	ChevronDown,
	LayoutDashboard,
	Monitor,
	Settings,
	UploadCloud,
	Shield,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import useAuthStore from "@/app/stores/useAuthStore";
import Button from "@/components/button/Button";
import { useSidebar } from "@/context/SidebarContext";

type SubSubItem = {
	name: string;
	path: string;
	description?: string;
};

type SubItem = {
	name: string;
	path?: string;
	description?: string;
	subItems?: SubSubItem[];
};

type NavItem = {
	name: string;
	icon: React.ReactNode;
	path?: string;
	description?: string;
	subItems?: SubItem[];
};

const AppSidebar: React.FC = () => {
	const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
	const { user, logout: logoutFn } = useAuthStore();
	const router = useRouter();

	const pathname = usePathname();

	const navItems: NavItem[] = useMemo(
		() => [
			{
				icon: <LayoutDashboard className="w-5 h-5" />,
				name: "Dashboard",
				path: "/dashboard",
				description: "Lihat ringkasan dan performa terbaru.",
			},
			{
				icon: <Box className="w-5 h-5" />,
				name: "Projects",
				path: "/projects",
				description: "Kelola proyek Anda secara efisien.",
			},
			{
				icon: <UploadCloud className="w-5 h-5" />,
				name: "Data Gathering",
				path: "/data-gathering",
				description: "Upload data menggunakan template Excel yang disediakan.",
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
					},
					{
						name: "OSF",
						description: "Operational Safety Frontline Monitoring.",
						subItems: [
							{ name: "AIRMS", path: "/monitoring/airms", description: "AIRMS Monitoring" },
							{ name: "PSAIMS", path: "/monitoring/psaims", description: "PSAIMS Monitoring" },
							{ name: "I2AIMS", path: "/monitoring/i2aims", description: "I2AIMS Monitoring" },
							{ name: "MIT", path: "/monitoring/mit", description: "Major Integrity Threat" },
							{ name: "MOC", path: "/monitoring/moc", description: "Management of Change" },
							{ name: "OPE", path: "/monitoring/ope", description: "Operational Performance & Excellence" },
						],
					},
					{
						name: "LCV",
						path: "/monitoring/lcv",
						description: "Loss Control & Verification Monitoring.",
					},
				],
			},
		],
		[],
	);

	const filterNavItems = () => {
		// For admin dashboard, show all menu items
		return navItems;
	};

	const filteredNavItems = filterNavItems();

	const [openSubmenu, setOpenSubmenu] = useState<{
		type: "main" | "others";
		index: number;
	} | null>(null);

	const [openNestedSubmenu, setOpenNestedSubmenu] = useState<string | null>(null);

	const isActive = useCallback(
		(path: string) => pathname.includes(path),
		[pathname],
	);

	const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
		setOpenSubmenu((prevOpenSubmenu) => {
			if (
				prevOpenSubmenu &&
				prevOpenSubmenu.type === menuType &&
				prevOpenSubmenu.index === index
			) {
				return null;
			}
			return { type: menuType, index };
		});
	};

	const handleNestedSubmenuToggle = (key: string) => {
		setOpenNestedSubmenu((prev) => (prev === key ? null : key));
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: "Intentional"
	useEffect(() => {
		let submenuMatched = false;
		let nestedSubmenuMatched = false;
		["main"].forEach((menuType) => {
			const items = menuType === "main" ? navItems : navItems;
			items.forEach((nav: NavItem, index: number) => {
				if (nav.subItems) {
					nav.subItems.forEach((subItem) => {
						if (subItem.path && isActive(subItem.path)) {
							setOpenSubmenu({
								type: menuType as "main" | "others",
								index,
							});
							submenuMatched = true;
						}
						if (subItem.subItems) {
							subItem.subItems.forEach((subSubItem) => {
								if (isActive(subSubItem.path)) {
									setOpenSubmenu({
										type: menuType as "main" | "others",
										index,
									});
									setOpenNestedSubmenu(`${nav.name}-${subItem.name}`);
									submenuMatched = true;
									nestedSubmenuMatched = true;
								}
							});
						}
					});
				}
			});
		});

		if (!submenuMatched) {
			setOpenSubmenu(null);
		}
		if (!nestedSubmenuMatched) {
			setOpenNestedSubmenu(null);
		}
	}, [pathname, isActive, navItems]);

	const renderMenuItems = (
		navItems: NavItem[],
		menuType: "main" | "others",
	) => (
		<ul className="flex flex-col gap-2">
			{navItems.map((nav, index) => (
				<li key={nav.name}>
					{nav.subItems && nav.subItems.length > 0 ? (
						<button
							type="button"
							onClick={() => handleSubmenuToggle(index, menuType)}
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
										openSubmenu?.type === menuType &&
										openSubmenu?.index === index
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
										<span
											className={`menu-item-text transition-all ease-in-out duration-300 ${
												isActive(nav.path)
													? "text-[#1E3A8A]"
													: "group-hover:text-white"
											}`}
										>
											{nav.name}
										</span>
									)}
								</Link>
							</Tooltip>
						)
					)}
					{nav.subItems && nav.subItems.length > 0 && (isExpanded || isHovered || isMobileOpen) && (
						<div
							className={`overflow-hidden transition-all duration-300 ease-in-out ${
								openSubmenu?.type === menuType && openSubmenu?.index === index
									? "max-h-[800px] opacity-100 mt-2"
									: "max-h-0 opacity-0 pointer-events-none"
							}`}
						>
							<ul className="space-y-1 ml-9">
								{nav.subItems.map((subItem) => {
									const nestedKey = `${nav.name}-${subItem.name}`;
									const isNestedOpen = openNestedSubmenu === nestedKey;
									
									if (subItem.subItems && subItem.subItems.length > 0) {
										return (
											<li key={subItem.name} className="flex flex-col">
												<button
													type="button"
													onClick={() => handleNestedSubmenuToggle(nestedKey)}
													className="relative flex items-center w-full gap-3 px-3 py-2 text-base font-medium rounded-lg transition-all ease-in-out duration-300 text-white/90 hover:bg-white/10 group cursor-pointer"
												>
													<span className="flex-1 text-left">{subItem.name}</span>
													<ChevronDown
														className={`w-4 h-4 transition-transform ease-in-out duration-300 text-white/90 ${
															isNestedOpen ? "rotate-180" : ""
														}`}
													/>
												</button>
												<div
													className={`overflow-hidden transition-all duration-300 ease-in-out ${
														isNestedOpen
															? "max-h-[500px] opacity-100 mt-1"
															: "max-h-0 opacity-0 pointer-events-none"
													}`}
												>
													<ul className="space-y-1 ml-6 border-l border-white/20 pl-3">
														{subItem.subItems.map((subSub) => (
															<li key={subSub.name}>
																<Tooltip title={subSub.description} placement="right" arrow>
																	<Link
																		href={subSub.path}
																		className={`relative flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ease-in-out duration-300 ${
																			isActive(subSub.path)
																				? "bg-white text-[#1E3A8A] hover:bg-white/95"
																				: "text-white/80 hover:bg-white/10 hover:text-white"
																		}`}
																	>
																		{subSub.name}
																	</Link>
																</Tooltip>
															</li>
														))}
													</ul>
												</div>
											</li>
										);
									}
									
									return (
										subItem.path && (
											<li key={subItem.name}>
												<Tooltip
													title={subItem.description}
													placement="right"
													arrow
												>
													<Link
														href={subItem.path}
														className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium transition-all ease-in-out duration-300 ${
															isActive(subItem.path)
																? "bg-white text-[#1E3A8A] hover:bg-white/95"
																: "text-white/85 hover:bg-white/10 hover:text-white"
														}`}
													>
														{subItem.name}
													</Link>
												</Tooltip>
											</li>
										)
									);
								})}
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
						<div>{renderMenuItems(filteredNavItems, "main")}</div>
					</div>
				</nav>
			</div>
			<div className="mt-auto pt-4 border-t border-white/20">
				<button
					type="button"
					className={`w-full flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-3 py-3 text-left transition-all duration-200 hover:bg-white/20 ${
						!isExpanded && !isHovered && !isMobileOpen ? "justify-center" : ""
					}`}
					onClick={() => {
						// Profile button is a placeholder for future profile page/action.
					}}
					aria-label="Profile"
				>
					<Image
						src="/profile.png"
						alt="Profile"
						width={40}
						height={40}
						className="h-10 w-10 rounded-full object-cover"
					/>
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
