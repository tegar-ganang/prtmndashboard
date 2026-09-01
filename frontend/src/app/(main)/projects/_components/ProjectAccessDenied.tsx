import { ShieldAlert } from "lucide-react";
import ButtonLink from "@/components/links/ButtonLink";

export default function ProjectAccessDenied() {
	return (
		<div className="p-6 lg:p-8 bg-gray-50 min-h-screen">
			<div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-8 flex flex-col items-center text-center gap-3 max-w-lg mx-auto mt-16">
				<ShieldAlert className="w-10 h-10 text-amber-500" />
				<h1 className="text-lg font-semibold text-gray-900">Akses Ditolak</h1>
				<p className="text-sm text-gray-500">
					Role Anda tidak memiliki izin untuk mengelola project. Hubungi administrator
					jika Anda merasa ini keliru.
				</p>
				<ButtonLink href="/projects" variant="outline" className="mt-2">
					Kembali ke Projects
				</ButtonLink>
			</div>
		</div>
	);
}
