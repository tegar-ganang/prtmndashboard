"use client";

import {
	ArrowLeft,
	Calendar,
	CalendarCheck,
	ChevronDown,
	Flag,
	MapPin,
	User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import useAuthStore from "@/app/stores/useAuthStore";
import ButtonLink from "@/components/links/ButtonLink";
import { canUploadMenu } from "@/configs/rbac";
import { formatProjectDate } from "../_lib/projectTransform";
import { useProjectDetailQuery } from "../_hooks/useProjectDetailQuery";
import ProjectScurveSection from "./ProjectScurveSection";

const priorityDotColor: Record<string, string> = {
	low: "bg-green-500",
	mid: "bg-yellow-500",
	high: "bg-red-500",
};

const DetailItem = ({
	icon: Icon,
	label,
	value,
	dotColor,
}: {
	icon: LucideIcon;
	label: string;
	value: string | number;
	dotColor?: string;
}) => (
	<div className="flex items-start gap-3">
		<Icon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
		<div>
			<p className="text-sm text-gray-500">{label}</p>
			<p className="text-base font-semibold text-gray-900 mt-0.5 flex items-center gap-2">
				{dotColor && <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />}
				{value}
			</p>
		</div>
	</div>
);

const DetailRow = ({ children }: { children: React.ReactNode }) => (
	<div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4 border-b border-gray-100 last:border-b-0">
		{children}
	</div>
);

export default function ProjectDetailContainer({ id }: { id: string }) {
	const { data: project, isLoading } = useProjectDetailQuery(id);
	const user = useAuthStore.useUser();
	const canManageProjects = canUploadMenu(user?.role_name, "project");

	return (
		<div className="p-6 lg:p-8 space-y-6 bg-gray-50 min-h-screen">
			<div className="flex items-center justify-between gap-4">
				<h1 className="text-2xl font-bold text-gray-900">
					{isLoading || !project ? "Loading..." : project.document_project.project_name}
				</h1>
				<div className="flex items-center gap-2">
					<ButtonLink
						href="/projects"
						variant="ghost"
						leftIcon={ArrowLeft}
						className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
					>
						Back to Projects
					</ButtonLink>
					{canManageProjects && (
						<ButtonLink href={`/projects/${id}/edit`} variant="blue">
							Update
						</ButtonLink>
					)}
				</div>
			</div>

			{!isLoading && project && (
				<details className="group rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
					<summary className="flex cursor-pointer select-none list-none items-center justify-between p-4 [&::-webkit-details-marker]:hidden">
						<span className="text-base font-bold text-gray-900">Detail Project</span>
						<ChevronDown className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" />
					</summary>
					<div className="px-4 pb-4">
						<DetailRow>
							<DetailItem icon={User} label="PIC" value={project.document_project.pic || "-"} />
							<DetailItem icon={MapPin} label="Project Location" value={project.document_project.project_location} />
							<DetailItem
								icon={Flag}
								label="Project Priority"
								value={project.document_project.project_priority.toUpperCase()}
								dotColor={priorityDotColor[project.document_project.project_priority]}
							/>
						</DetailRow>
						<DetailRow>
							<DetailItem
								icon={Calendar}
								label="Start Date"
								value={formatProjectDate(project.document_project.operational_start_date)}
							/>
							<DetailItem
								icon={CalendarCheck}
								label="End Date"
								value={formatProjectDate(project.document_project.estimated_completion_date)}
							/>
						</DetailRow>
					</div>
				</details>
			)}

			<ProjectScurveSection projectId={id} canUpload={canManageProjects} />
		</div>
	);
}
