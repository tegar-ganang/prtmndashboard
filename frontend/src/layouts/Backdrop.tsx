"use client";

import type React from "react";
import { useSidebar } from "@/context/SidebarContext";

const Backdrop: React.FC = () => {
	const { isMobileOpen, toggleMobileSidebar } = useSidebar();

	if (!isMobileOpen) return null;

	return (
		<button
			type="button"
			className="fixed inset-0 z-40 bg-gray-100/50 lg:hidden"
			onClick={toggleMobileSidebar}
		/>
	);
};

export default Backdrop;
