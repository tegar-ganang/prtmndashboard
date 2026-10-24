"use client";

import { type SubmitHandler } from "react-hook-form";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import useAuthStore from "@/app/stores/useAuthStore";
import ButtonLink from "@/components/links/ButtonLink";
import { canUploadMenu } from "@/configs/rbac";
import type { CreateProjectRequest, ProjectType } from "@/types/project";
import ProjectAccessDenied from "../_components/ProjectAccessDenied";
import ProjectForm from "../_components/ProjectForm";
import { defaultProjectFormValues } from "../_lib/projectTransform";
import { useCreateProjectMutation } from "../_hooks/useCreateProjectMutation";

// projectType comes from the BD / Non-BD list the user clicked "Create" on.
export default function CreateProjectContainer({ projectType }: { projectType?: ProjectType }) {
	const router = useRouter();
	const defaultValues = useMemo(
		() => (projectType ? { ...defaultProjectFormValues, projectType } : defaultProjectFormValues),
		[projectType],
	);
	const { mutate: createProject, isPending } = useCreateProjectMutation();
	const user = useAuthStore.useUser();

	if (!canUploadMenu(user, "project")) {
		return <ProjectAccessDenied />;
	}

	const onSubmit: SubmitHandler<CreateProjectRequest> = (data) => {
		createProject(data, {
			onSuccess: () => {
				router.push(projectType ? `/projects/${projectType === "BD" ? "bd" : "non-bd"}` : "/projects");
			},
		});
	};

	return (
		<div className="p-6 lg:p-8 space-y-6 bg-gray-50 min-h-screen">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Create Project</h1>
					<p className="text-sm text-gray-600 mt-1">
						Fill in the project details to create a new entry.
					</p>
				</div>
				<ButtonLink
					href={projectType ? `/projects/${projectType === "BD" ? "bd" : "non-bd"}` : "/projects"}
					variant="outline"
					leftIcon={ArrowLeft}
				>
					Back to Projects
				</ButtonLink>
			</div>

			<section className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-6 lg:p-8">
				<ProjectForm
					defaultValues={defaultValues}
					onSubmit={onSubmit}
					submitLabel="Create Project"
					isSubmitting={isPending}
				/>
			</section>
		</div>
	);
}
