"use client";

import ButtonLink from "@/components/links/ButtonLink";
import { formatProjectCurrency, formatProjectDate } from "../_lib/projectTransform";
import { useProjectDetailQuery } from "../_hooks/useProjectDetailQuery";

const DetailItem = ({ label, value }: { label: string; value: string | number }) => (
	<div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
		<p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
		<p className="text-sm font-medium text-gray-900 mt-1">{value}</p>
	</div>
);

export default function ProjectDetailContainer({ id }: { id: string }) {
	const { data: project, isLoading } = useProjectDetailQuery(id);

	return (
		<div className="p-6 lg:p-8 space-y-6 bg-gray-50 min-h-screen">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Project Detail</h1>
					<p className="text-sm text-gray-600 mt-1">
						Detailed information for project id: {id}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<ButtonLink href="/projects" variant="outline">
						Back to Projects
					</ButtonLink>
					<ButtonLink href={`/projects/${id}/edit`} variant="blue">
						Update
					</ButtonLink>
				</div>
			</div>

			<section className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-5 lg:p-6">
				{isLoading || !project ? (
					<p className="text-sm text-gray-500">Loading project detail...</p>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
						<DetailItem label="Project Name" value={project.document_project.project_name} />
						<DetailItem
							label="Project Location"
							value={project.document_project.project_location}
						/>
						<DetailItem
							label="Project Priority"
							value={project.document_project.project_priority.toUpperCase()}
						/>
						<DetailItem
							label="Category"
							value={project.kategori_proyek}
						/>
						<DetailItem
							label="Project Value"
							value={formatProjectCurrency(project.document_project.project_value)}
						/>
						<DetailItem
							label="Estimated Progress"
							value={`${project.document_project.estimated_progress_percentage}%`}
						/>
						<DetailItem
							label="Document Created At"
							value={formatProjectDate(project.document_project.document_created_at)}
						/>
						<DetailItem
							label="Operational Start Date"
							value={formatProjectDate(project.document_project.operational_start_date)}
						/>
						<DetailItem
							label="Estimated Completion Date"
							value={formatProjectDate(project.document_project.estimated_completion_date)}
						/>
						<DetailItem label="Earned Value (EV)" value={project.earned_value_ev} />
						<DetailItem label="Planned Value (PV)" value={project.planned_value_pv} />
						<DetailItem label="Actual Cost (AC)" value={project.actual_cost_ac} />
						<DetailItem label="Budget (BAC)" value={project.budget_bac} />
						<DetailItem
							label="Milestone and Work Stages"
							value={project.milestone_and_work_stages}
						/>
					</div>
				)}
			</section>
		</div>
	);
}
