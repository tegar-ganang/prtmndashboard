"use client";

import { type SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import ButtonLink from "@/components/links/ButtonLink";
import type { CreateProjectRequest } from "@/types/project";
import ProjectForm from "../_components/ProjectForm";
import { defaultProjectFormValues } from "../_lib/projectTransform";
import { useCreateProjectMutation } from "../_hooks/useCreateProjectMutation";

export default function CreateProjectContainer() {
	const router = useRouter();
	const { mutate: createProject, isPending } = useCreateProjectMutation();

	const onSubmit: SubmitHandler<CreateProjectRequest> = (data) => {
		createProject(data, {
			onSuccess: () => {
				router.push("/projects");
			},
		});
	};

	return (
		<div className="p-6 lg:p-8 space-y-6 bg-gray-50 min-h-screen">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Create Project</h1>
					<p className="text-sm text-gray-600 mt-1">
						Fill the project form to create a new entry.
					</p>
				</div>
				<ButtonLink href="/projects" variant="outline">
					Back to Projects
				</ButtonLink>
			</div>

			<section className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-5 lg:p-6">
				<ProjectForm
					defaultValues={defaultProjectFormValues}
					onSubmit={onSubmit}
					submitLabel="Create Project"
					isSubmitting={isPending}
				/>
			</section>
		</div>
	);
}
