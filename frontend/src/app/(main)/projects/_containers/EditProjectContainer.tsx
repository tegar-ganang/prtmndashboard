"use client";

import { type SubmitHandler } from "react-hook-form";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import ButtonLink from "@/components/links/ButtonLink";
import type { CreateProjectRequest } from "@/types/project";
import ProjectForm from "../_components/ProjectForm";
import { projectToFormValues } from "../_lib/projectTransform";
import { useProjectDetailQuery } from "../_hooks/useProjectDetailQuery";
import { useUpdateProjectMutation } from "../_hooks/useUpdateProjectMutation";

export default function EditProjectContainer({ id }: { id: string }) {
	const router = useRouter();
	const { data: project, isLoading } = useProjectDetailQuery(id);
	const { mutate: updateProject, isPending } = useUpdateProjectMutation(id);
	const defaultValues = useMemo(
		() => (project ? projectToFormValues(project) : null),
		[project],
	);

	const onSubmit: SubmitHandler<CreateProjectRequest> = (data) => {
		updateProject(data, {
			onSuccess: () => {
				router.push(`/projects/${id}`);
			},
		});
	};

	return (
		<div className="p-6 lg:p-8 space-y-6 bg-gray-50 min-h-screen">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Update Project</h1>
					<p className="text-sm text-gray-600 mt-1">
						Update the selected project data.
					</p>
				</div>
				<ButtonLink href="/projects" variant="outline">
					Back to Projects
				</ButtonLink>
			</div>

			<section className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-5 lg:p-6">
				{isLoading || !defaultValues ? (
					<p className="text-sm text-gray-500">Loading project data...</p>
				) : (
					<ProjectForm
						defaultValues={defaultValues}
						onSubmit={onSubmit}
						submitLabel="Update Project"
						isSubmitting={isPending}
					/>
				)}
			</section>
		</div>
	);
}
