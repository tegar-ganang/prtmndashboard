import type { ProjectType } from "@/types/project";
import CreateProjectContainer from "../_containers/CreateProjectContainer";

export default async function CreateProjectPage({
	searchParams,
}: {
	searchParams: Promise<{ type?: string }>;
}) {
	const { type } = await searchParams;
	const projectType: ProjectType | undefined = type === "BD" || type === "NON_BD" ? type : undefined;

	return <CreateProjectContainer projectType={projectType} />;
}
