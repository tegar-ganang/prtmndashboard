"use client";
import { Logs, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import useAuthStore from "@/app/stores/useAuthStore";
import { useSidebar } from "@/context/SidebarContext";

const AppHeader: React.FC = () => {
	const [today, setToday] = useState("");
	const { isMobileOpen, toggleSidebar, toggleMobileSidebar, isMobile } =
		useSidebar();
	const router = useRouter();

	const inputRef = useRef<HTMLInputElement>(null);

	const handleToggle = () => {
		if (window.innerWidth >= 1024) {
			toggleSidebar();
		} else {
			toggleMobileSidebar();
		}
	};

	useEffect(() => {
		const date = new Date();
		const parts = new Intl.DateTimeFormat("id-ID", {
			weekday: "long",
			day: "numeric",
			month: "long",
			year: "numeric",
		}).formatToParts(date);

		const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
		const dayValue = Number(parts.find((p) => p.type === "day")?.value ?? 0);
		const month = parts.find((p) => p.type === "month")?.value ?? "";
		const year = parts.find((p) => p.type === "year")?.value ?? "";

		setToday(`${weekday}, ${dayValue} ${month} ${year}`);
	}, []);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key === "k") {
				event.preventDefault();
				inputRef.current?.focus();
			}
		};

		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, []);

	return (
		<header
			className={`sticky top-0 flex w-full bg-white border-gray-200 z-999 border ${isMobile ? "" : "hidden"}`}
		>
			<div className="flex flex-col items-center justify-between grow lg:px-8 lg:flex-row">
				<div className="flex items-center justify-between w-full gap-4 px-3 py-3 border-b border-gray-200 sm:gap-7 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-2">
					<button
						type="button"
						className="items-center justify-center hover:bg-gray-100 flex w-10 h-10 transition-colors duration-200 cursor-pointer text-gray-500 border-gray-200 rounded-lg z-50 lg:h-11 lg:w-11 lg:border"
						onClick={handleToggle}
						aria-label="Toggle Sidebar"
					>
						{isMobileOpen ? <X /> : <Logs />}
					</button>
					<div className="flex w-full justify-between">
						<div className="flex flex-col justify-center lg:gap-1">
							<h3 className="text-xs lg:text-base text-gray-500">{today}</h3>
						</div>

						<div className="flex items-center justify-between">
							<h3 className="hidden pointer-events-none rounded-xl px-4 py-2 sm:flex gap-2 items-center text-gray-700 text-base">
								<Image
									src="/LogoGlobalJaya.png"
									alt="User"
									width={20}
									height={20}
									className="w-8 h-8 rounded-full"
								/>
								<p>Kevin Andreas</p>
							</h3>
						</div>
					</div>
				</div>
			</div>
		</header>
	);
};

export default AppHeader;
