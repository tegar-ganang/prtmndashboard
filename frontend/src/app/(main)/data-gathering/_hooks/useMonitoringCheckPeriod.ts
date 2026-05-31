import { get } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { ApiResponse } from "@/types/api";

interface CheckPeriodResponse {
	exists: boolean;
}

export const checkMonitoringPeriodExists = async (docType: string, year: number, period: number, field?: string): Promise<boolean> => {
	let endpoint = MAIN_ENDPOINT.Mit.CheckPeriod;
	let query = `?year=${year}&quarter=${period}`;

	if (docType === "HAZID") {
		endpoint = MAIN_ENDPOINT.Hazid.CheckPeriod;
		query = `?year=${year}&month=${period}`;
	} else if (docType === "HAZOP") {
		endpoint = MAIN_ENDPOINT.Hazop.CheckPeriod;
		query = `?year=${year}&month=${period}`;
	} else if (docType === "LOPA") {
		endpoint = MAIN_ENDPOINT.Lopa.CheckPeriod;
		query = `?year=${year}&month=${period}`;
	} else if (docType === "PRODUKSI") {
		endpoint = MAIN_ENDPOINT.Produksi.CheckPeriod;
		query = `?year=${year}&month=${period}`;
	}

	if (field) {
		query += `&field=${field}`;
	}

	const { Kind, OK } = await get<ApiResponse<CheckPeriodResponse>>(`${endpoint}${query}`);

	if (!OK) {
		const errorData = Kind as any;
		const errorMessage = errorData?.err || errorData?.message || errorData?.Message || `Telah terjadi kesalahan saat mengecek data periode ${docType}`;
		throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
	}

	const response = Kind as ApiResponse<CheckPeriodResponse>;
	return response.data?.exists ?? false;
};
