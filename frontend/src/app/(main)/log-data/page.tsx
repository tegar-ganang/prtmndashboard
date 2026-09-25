import { Metadata } from "next";
import LogDataContainer from "./_containers/LogDataContainer";

export const metadata: Metadata = {
	title: "Log Data",
	description: "Cek status sinkronisasi data ke mart_pertamina",
};

export default function LogDataPage() {
	return <LogDataContainer />;
}
