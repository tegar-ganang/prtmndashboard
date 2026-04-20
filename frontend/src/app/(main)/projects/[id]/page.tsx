import ProjectDetailContainer from "../_containers/ProjectDetailContainer";

export default async function ProjectDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	return <ProjectDetailContainer id={id} />;
}
