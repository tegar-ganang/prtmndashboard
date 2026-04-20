import EditProjectContainer from "../../_containers/EditProjectContainer";

export default async function EditProjectPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	return <EditProjectContainer id={id} />;
}
