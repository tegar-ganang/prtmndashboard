import type { Metadata } from "next";
import AuthLayout from "@/layouts/AuthLayout";

export const metadata: Metadata = {
	title: "Auth",
	description: "Sign in to access the application.",
};

export default function AuthRouteLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <AuthLayout>{children}</AuthLayout>;
}
