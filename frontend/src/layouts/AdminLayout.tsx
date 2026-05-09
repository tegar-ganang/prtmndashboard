"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";
import Backdrop from "./Backdrop";
import withAuth from "@/components/hoc/withAuth";

interface LayoutProps {
	children: React.ReactNode;
	className?: string;
}

function AdminLayout({ children, className }: LayoutProps) {
	const { isExpanded, isHovered, isMobileOpen } = useSidebar();

	const mainContentMargin = isMobileOpen
		? "ml-0"
		: isExpanded || isHovered
			? "lg:ml-[279px]"
			: "lg:ml-[88px]";

	return (
		<div className="min-h-screen xl:flex">
			<AppSidebar />
			<Backdrop />
			<div
				className={`flex-1 transition-all duration-300 ease-in-out overflow-hidden min-w-0 ${mainContentMargin}`}
			>
				<AppHeader />
				<div className={`mx-auto ${className ?? ""}`}>{children}</div>
			</div>
		</div>
	);
}

export default withAuth(AdminLayout, "protected");
