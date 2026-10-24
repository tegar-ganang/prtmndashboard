"use client";

import {
	ArrowLeft,
	Briefcase,
	Calendar,
	CalendarCheck,
	ChevronDown,
	Clock,
	Flag,
	MapPin,
	PlayCircle,
	User,
	UserCheck,
	Wallet,
} from "lucide-react";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import useAuthStore from "@/app/stores/useAuthStore";
import Button from "@/components/button/Button";
import ConfirmationDialog from "@/components/dialog/ConfirmationDialog";
import ButtonLink from "@/components/links/ButtonLink";
import { canUploadMenu } from "@/configs/rbac";
import {
	formatProjectCurrency,
	formatProjectDate,
	PROJECT_STATUS_LABEL,
	PROJECT_TYPE_LABEL,
	projectToFormValues,
} from "../_lib/projectTransform";
import { useProjectDetailQuery } from "../_hooks/useProjectDetailQuery";
import { useUpdateProjectMutation } from "../_hooks/useUpdateProjectMutation";
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
	const canManageProjects = canUploadMenu(user, "project");
	const { mutate: updateProject, isPending: isStarting } = useUpdateProjectMutation(id);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const isPreEksekusi = project?.document_project.status === "PRE_EKSEKUSI";

	const handleStartEksekusi = () => {
		if (!project) {
			return;
		}

		updateProject(
			{ ...projectToFormValues(project), status: "EKSEKUSI" },
			{ onSuccess: () => setIsConfirmOpen(false) },
		);
	};

	return (
		<div className="p-6 lg:p-8 space-y-6 bg-gray-50 min-h-screen">
			<div className="flex items-center justify-between gap-4">
				<h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
					{isLoading || !project ? "Loading..." : project.document_project.project_name}
					{project && (
						<span
							className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
								isPreEksekusi ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
							}`}
						>
							{PROJECT_STATUS_LABEL[project.document_project.status]}
						</span>
					)}
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

			{!isLoading && project && isPreEksekusi && (
				<section className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-4 space-y-4">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h2 className="text-base font-bold text-gray-900">Pre Eksekusi</h2>
							<p className="text-sm text-gray-500">
								Upload progress baru bisa dilakukan setelah status project diubah ke Eksekusi.
							</p>
						</div>
						{canManageProjects && (
							<Button variant="blue" leftIcon={PlayCircle} onClick={() => setIsConfirmOpen(true)}>
								Mulai Eksekusi
							</Button>
						)}
					</div>
					<div>
						<DetailRow>
							<DetailItem icon={User} label="PIC Project" value={project.document_project.pic || "-"} />
							<DetailItem
								icon={UserCheck}
								label="Owner Project"
								value={project.document_project.owner_project || "-"}
							/>
							<DetailItem
								icon={Wallet}
								label="Estimated Cost"
								value={formatProjectCurrency(project.document_project.project_value)}
							/>
						</DetailRow>
						<DetailRow>
							<DetailItem
								icon={Calendar}
								label="Target Timeline Start"
								value={formatProjectDate(project.document_project.operational_start_date)}
							/>
							<DetailItem
								icon={CalendarCheck}
								label="Target Timeline Deliverable"
								value={formatProjectDate(project.document_project.estimated_completion_date)}
							/>
							<DetailItem
								icon={Clock}
								label="Durasi"
								value={
									project.document_project.target_duration_days == null
										? "-"
										: `${project.document_project.target_duration_days} hari`
								}
							/>
						</DetailRow>
					</div>
				</section>
			)}

			{!isLoading && project && !isPreEksekusi && (
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
							<DetailItem
								icon={Briefcase}
								label="Project Type"
								value={PROJECT_TYPE_LABEL[project.document_project.project_type]}
							/>
						</DetailRow>
					</div>
				</details>
			)}

			{project && !isPreEksekusi && <ProjectScurveSection projectId={id} canUpload={canManageProjects} />}

			<ConfirmationDialog
				isOpen={isConfirmOpen}
				setIsOpen={setIsConfirmOpen}
				message={
					isStarting
						? "Mengubah status project..."
						: "Ubah status project ke Eksekusi? Status tidak bisa dikembalikan ke Pre Eksekusi."
				}
				onConfirm={handleStartEksekusi}
			/>
		</div>
	);
}
