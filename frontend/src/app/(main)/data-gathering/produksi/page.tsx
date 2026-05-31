import { Metadata } from "next";
import ProduksiUploadContainer from "./_containers/ProduksiUploadContainer";

export const metadata: Metadata = {
	title: "Upload Produksi Harian — Pertamina Dashboard",
	description:
		"Upload data realisasi produksi harian (Sheet 1) beserta target bulanan (Sheet 2) dari file Excel template Produksi.",
};

export default function ProduksiUploadPage() {
	return <ProduksiUploadContainer />;
}
