/**
 * useProduksiBatchMutation — kirim file Excel langsung ke /produksi/upload-excel.
 * Backend yang handle parsing 2 sheet (Sheet 1: realisasi harian, Sheet 2: target bulanan).
 * Berbeda dengan MIT/HAZID/HAZOP/LOPA yang pakai JSON batch endpoint.
 */
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import axiosInstance from "@/services/api/main/interceptor";

interface ProduksiUploadPayload {
	file: File;
	reporting_year: number;
	reporting_month: number;
	field?: string;
	mode?: "append" | "overwrite";
}

interface UseProduksiBatchMutationProps {
	onSuccess?: (data: { upload_batch_id: string }) => void;
}

export const useProduksiBatchMutation = ({ onSuccess }: UseProduksiBatchMutationProps = {}) => {
	return useMutation({
		mutationFn: async (payload: ProduksiUploadPayload) => {
			const formData = new FormData();
			formData.append("file", payload.file);
			formData.append("reporting_year", String(payload.reporting_year));
			formData.append("reporting_month", String(payload.reporting_month));
			if (payload.field) formData.append("field", payload.field);
			formData.append("mode", payload.mode ?? "append");

			const { data } = await axiosInstance.post("/produksi/upload-excel", formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});

			if (!data.success) {
				throw new Error(data.message || "Gagal upload data produksi");
			}

			return data.data as { upload_batch_id: string };
		},
		onSuccess: (data) => {
			toast.success("Berhasil mengunggah data Produksi Harian");
			onSuccess?.(data);
		},
		onError: (error: any) => {
			toast.error(error?.message || "Gagal mengunggah data Produksi Harian");
		},
	});
};
