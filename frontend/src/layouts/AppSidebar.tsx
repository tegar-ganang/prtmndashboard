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
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useAuthStore from "@/app/stores/useAuthStore";
import Button from "@/components/button/Button";
import { useSidebar } from "@/context/SidebarContext";

type NavItem = {
	name: string;
	icon: React.ReactNode;
	path?: string;
	description?: string;
	subItems?: { name: string; path: string; description?: string }[];
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
				description: "Upload data MIT, HAZID, HAZOP, LOPA, Produksi.",
			},
			{
				icon: <Monitor className="w-5 h-5" />,
				name: "Monitoring",
				description: "Dashboard monitoring per dokumen.",
				subItems: [
					{ name: "MIT (Quartal)", path: "/monitoring/mit", description: "Major Integrity Threat - Quarterly" },
					{ name: "HAZID (Bulanan)", path: "/monitoring/hazid", description: "Hazard Identification - Monthly" },
					{ name: "HAZOP (Bulanan)", path: "/monitoring/hazop", description: "Hazard & Operability Study - Monthly" },
					{ name: "LOPA (Bulanan)", path: "/monitoring/lopa", description: "Layer of Protection Analysis - Monthly" },
					{ name: "Produksi (Bulanan)", path: "/monitoring/produksi", description: "Monitoring produksi gas harian Donggi-Matindok" },
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

	const renderMenuItems = (
		navItems: NavItem[],
		menuType: "main" | "others",
	) => (
		<ul className="flex flex-col gap-2">
			{navItems.map((nav, index) => (
				<li key={nav.name}>
					{nav.subItems ? (
						<button
							type="button"
							onClick={() => handleSubmenuToggle(index, menuType)}
							className={`relative flex items-center w-full gap-3 ${
								(isExpanded || isHovered || isMobileOpen) && "px-3 py-2"
							} font-medium rounded-lg group transition-all ease-in-out duration-300 ${"text-gray-400 hover:bg-gray-100 group-hover:text-gray-400"} cursor-pointer ${
								!isExpanded && !isHovered
									? "lg:justify-center"
									: "lg:justify-start"
							}`}
						>
							<span
								className={`transition-all ease-in-out duration-300 ${"text-gray-400 group-hover:text-gray-400"} ${
									!(isExpanded || isHovered || isMobileOpen) &&
									"aspect-square p-2 flex justify-center items-center mx-auto"
								}`}
							>
								{nav.icon}
							</span>
							{(isExpanded || isHovered || isMobileOpen) && (
								<span
									className={`menu-item-text transition-all ease-in-out duration-300 ${"group-hover:text-gray-400"}`}
								>
									{nav.name}
								</span>
							)}
							{(isExpanded || isHovered || isMobileOpen) && (
								<ChevronDown
									className={`ml-auto w-5 h-5 transition-transform ease-in-out duration-300  ${
										openSubmenu?.type === menuType &&
										openSubmenu?.index === index
											? "rotate-180 text-gray-400"
											: "text-gray-400"
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
											? "bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800"
											: "text-gray-400 hover:bg-gray-100 group-hover:text-gray-400"
									}`}
								>
									<span
										className={`transition-all ease-in-out duration-300 ${
											isActive(nav.path)
												? "text-blue-700 group-hover:text-blue-800"
												: "text-gray-400 group-hover:text-gray-400"
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
													? "text-blue-700 group-hover:text-blue-800"
													: "group-hover:text-gray-400"
											}`}
										>
											{nav.name}
										</span>
									)}
								</Link>
							</Tooltip>
						)
					)}
					{nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
						<div
							ref={(el) => {
								subMenuRefs.current[`${menuType}-${index}`] = el;
							}}
							className="overflow-hidden transition-all ease-in-out duration-300"
							style={{
								height:
									openSubmenu?.type === menuType && openSubmenu?.index === index
										? `${subMenuHeight[`${menuType}-${index}`]}px`
										: "0px",
							}}
						>
							<ul className="mt-2 space-y-1 ml-9">
								{nav.subItems.map((subItem) => (
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
														? "bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800"
														: "text-gray-400 hover:bg-gray-100"
												}`}
											>
												{subItem.name}
											</Link>
										</Tooltip>
									</li>
								))}
							</ul>
						</div>
					)}
				</li>
			))}
		</ul>
	);

	const [openSubmenu, setOpenSubmenu] = useState<{
		type: "main" | "others";
		index: number;
	} | null>(null);
	const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
		{},
	);
	const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

	const isActive = useCallback(
		(path: string) => pathname.includes(path),
		[pathname],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: "Intentional"
	useEffect(() => {
		let submenuMatched = false;
		["main"].forEach((menuType) => {
			const items = menuType === "main" ? navItems : navItems;
			items.forEach((nav: NavItem, index: number) => {
				if (nav.subItems) {
					nav.subItems.forEach((subItem) => {
						if (isActive(subItem.path)) {
							setOpenSubmenu({
								type: menuType as "main" | "others",
								index,
							});
							submenuMatched = true;
						}
					});
				}
			});
		});

		if (!submenuMatched) {
			setOpenSubmenu(null);
		}
	}, [pathname, isActive, navItems]);

	useEffect(() => {
		if (openSubmenu !== null) {
			const key = `${openSubmenu.type}-${openSubmenu.index}`;
			if (subMenuRefs.current[key]) {
				setSubMenuHeight((prevHeights) => ({
					...prevHeights,
					[key]: subMenuRefs.current[key]?.scrollHeight || 0,
				}));
			}
		}
	}, [openSubmenu]);

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

	return (
		<aside
			className={`fixed flex flex-col p-6 bg-white text-gray-900 ${
				isMobileOpen ? "h-[calc(100vh-67px)]" : "h-screen"
			} transition-all justify-between duration-300 ease-in-out z-999 border-r border-gray-200
        ${isExpanded || isMobileOpen ? "w-70" : isHovered ? "w-70" : "w-22.5"}
			${isMobileOpen ? "translate-x-0 mt-16.75" : "-translate-x-full"}
        lg:translate-x-0`}
			onMouseEnter={() => !isExpanded && setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<div>
				<div
					className={`flex items-center gap-2 ${
						!isExpanded && !isHovered
							? "lg:justify-center mb-8"
							: "justify-start mb-8"
					}`}
				>
					<Link href="/" className="flex items-center gap-3 w-full">
						<Image
							src={
								isExpanded || isHovered || isMobileOpen
									? "/PertaminaLogo.png"
									: "/PertaminaLogoSmall.png"
							}
							alt="Bayucaraka ITS"
							width={300}
							height={300}
							className="rounded-lg"
							priority
						/>
					</Link>
				</div>
				<div className="flex flex-col overflow-x-hidden overflow-y-auto duration-300 ease-linear no-scrollbar">
					<nav className="mb-6">
						<div className="flex flex-col gap-4">
							<div>{renderMenuItems(filteredNavItems, "main")}</div>
						</div>
					</nav>
				</div>
			</div>
			<div className="mt-auto pt-4 border-t border-gray-200">
				<button
					type="button"
					className={`w-full flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-left transition-all duration-200 hover:bg-gray-100 ${
						!isExpanded && !isHovered && !isMobileOpen ? "justify-center" : ""
					}`}
					onClick={() => {
						// Profile button is a placeholder for future profile page/action.
					}}
					aria-label="Profile"
				>
					<Image
						src="/PertaminaLogo.png"
						alt="Profile"
						width={40}
						height={40}
						className="h-10 w-10 rounded-full object-cover"
					/>
					{(isExpanded || isHovered || isMobileOpen) && (
						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-semibold text-gray-900">
								{user?.name || "Name Not Available"}
							</p>
							<p className="truncate text-xs text-gray-500">Profile</p>
						</div>
					)}
				</button>

				<Button
					onClick={() => {
						logoutFn();
						router.push("/login");
					}}
					variant="red"
					className={`mt-3 w-full ${
						!isExpanded && !isHovered && !isMobileOpen ? "justify-center px-0" : ""
					}`}
				>
					{isExpanded || isHovered || isMobileOpen ? "Logout" : ""}
				</Button>
			</div>
		</aside>
	);
};

export default AppSidebar;
