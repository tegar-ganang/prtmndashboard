import { ShieldOff } from "lucide-react";

interface AccessDeniedCardProps {
	title?: string;
	description: string;
}

/** Consistent "no permission" state — used wherever a role-gated page/section has no access. */
export default function AccessDeniedCard({
	title = "Akses tidak tersedia",
	description,
}: AccessDeniedCardProps) {
	return (
		<div className="flex flex-col items-center justify-center text-center gap-3 bg-white rounded-xl border border-gray-200 shadow-sm py-16 px-6">
			<div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-50">
				<ShieldOff className="w-6 h-6 text-amber-600" />
			</div>
			<h2 className="text-base font-semibold text-gray-900">{title}</h2>
			<p className="text-sm text-gray-500 max-w-sm">{description}</p>
		</div>
	);
}
