import type { Metadata } from "next";

export const siteConfig = {
	title: "Pertamina EP Dashboard",
	description:
		"Dashboard untuk memudahkan proses controlling dan monitoring di Pertamina EP.",
	url: process.env.SITE_URL || "https://example.com",
};

export const metadataConfig: Metadata = {
	metadataBase: new URL(siteConfig.url),
	title: {
		default: siteConfig.title,
		template: `%s - ${siteConfig.title}`,
	},
	description: siteConfig.description,
	icons: {
		icon: "/LogoGlobalJaya.png",
		apple: "/LogoGlobalJaya.png",
	},
	twitter: {
		card: "summary_large_image",
	},
	robots: { index: true, follow: true },
	authors: [
		{
			name: siteConfig.title,
			url: siteConfig.url,
		},
	],
	openGraph: {
		title: siteConfig.title,
		description: siteConfig.description,
		url: siteConfig.url,
		siteName: siteConfig.title,
		type: "website",
		locale: "id_ID",
		images: [
			{
				url: "/LogoGlobalJaya.png",
				width: 1200,
				height: 630,
				alt: siteConfig.title,
			},
		],
	},
};
