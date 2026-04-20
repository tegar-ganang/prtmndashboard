export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen w-full flex flex-col justify-center items-center bg-gray-50">
			{children}
		</div>
	);
}
