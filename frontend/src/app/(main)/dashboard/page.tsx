import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Dashboard",
	description: "Welcome to the dashboard page.",
};

export default function Home() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-between p-24">
			<h1 className="text-4xl font-bold">Welcome to the Home Page</h1>
			<p className="mt-4 text-lg">This is the main page of the application.</p>
		</main>
	);
}
