import "./globals.css";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Head from "next/head";
import { headers } from "next/headers";
import Providers from "@/app/providers";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { siteConfig } from "../../seo-config";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
	metadataBase: new URL(siteConfig.url),
	title: { default: siteConfig.title, template: `%s - ${siteConfig.title}` },
	description: siteConfig.description,
	twitter: { card: "summary_large_image" },
	robots: { index: true, follow: true },
	authors: [{ name: siteConfig.title, url: siteConfig.url }],
};

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const nonce = (await headers()).get("x-nonce") ?? "";

	return (
		<html lang="en">
			<Head>
				<meta name="apple-mobile-web-app-title" content={siteConfig.title} />
			</Head>
			{process.env.NEXT_PUBLIC_RUN_MODE === "production" && <GoogleAnalytics nonce={nonce} />}
			<body className={`${inter.className}`}>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
