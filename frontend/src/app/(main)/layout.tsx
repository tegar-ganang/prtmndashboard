import type { Metadata } from "next";
import { SidebarProvider } from "@/context/SidebarContext";
import AdminLayout from "@/layouts/AdminLayout";
import { metadataConfig } from "../../../seo-config";

export const metadata: Metadata = metadataConfig;

export default function AdminLayoutWrapper({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<SidebarProvider>
			<AdminLayout>{children}</AdminLayout>
		</SidebarProvider>
	);
}
