import { Metadata } from "next";
import DataGatheringContainer from "./_containers/DataGatheringContainer";

export const metadata: Metadata = {
	title: "Data Gathering - MIT Register",
	description: "Upload dan kelola data MIT Register menggunakan template Excel",
};

export default function DataGatheringPage() {
	return <DataGatheringContainer />;
}
