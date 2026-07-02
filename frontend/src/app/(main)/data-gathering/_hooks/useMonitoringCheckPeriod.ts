import axiosInstance from "@/services/api/main/interceptor";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";

export const checkMonitoringPeriodExists = async (
	docType: string,
	year: number,
	period: number,
	field?: string,
): Promise<boolean> => {
	try {
		let url: string;
		let params: Record<string, any>;

		if (docType === "ZONA_INDICATOR") {
			url = MAIN_ENDPOINT.ZonaIndicator.CheckPeriod;
			params = { year };
			if (field) params.zona = field;
		} else if (docType === "ZONA_PSE_LIST") {
			url = MAIN_ENDPOINT.ZonaPseList.CheckPeriod;
			params = { year, month: period };
			if (field) params.zona = field;
		} else if (docType === "MIT") {
			url = MAIN_ENDPOINT.Mit.CheckPeriod;
			params = { year, quarter: period };
			if (field) params.field = field;
		} else if (docType === "HAZID") {
			url = MAIN_ENDPOINT.Hazid.CheckPeriod;
			params = { year, month: period };
			if (field) params.field = field;
		} else if (docType === "HAZOP") {
			url = MAIN_ENDPOINT.Hazop.CheckPeriod;
			params = { year, month: period };
			if (field) params.field = field;
		} else if (docType === "LOPA") {
			url = MAIN_ENDPOINT.Lopa.CheckPeriod;
			params = { year, month: period };
			if (field) params.field = field;
		} else if (docType === "MOC") {
			url = MAIN_ENDPOINT.Moc.CheckPeriod;
			params = { year, month: period };
			if (field) params.field = field;
		} else if (docType === "HSSE") {
			url = MAIN_ENDPOINT.Hsse.CheckPeriod;
			params = { year, month: period };
			if (field) params.field = field;
		} else if (docType === "AIRMS") {
			url = MAIN_ENDPOINT.Airms.CheckPeriod;
			params = { year, month: period };
			if (field) params.field = field;
		} else if (docType === "I2AIMS") {
			url = MAIN_ENDPOINT.I2aims.CheckPeriod;
			params = { year, month: period };
			if (field) params.field = field;


		} else if (docType === "PRODUKSI") {

			url = MAIN_ENDPOINT.Produksi.CheckPeriod;
			params = { year, month: period };
		} else {
			// Unknown type — assume no existing data
			return false;
		}

		const response = await axiosInstance.get(url, { params });
		return response.data?.data?.exists ?? false;
	} catch (error) {
		// Re-throw so the caller can decide what to do
		throw error;
	}
};
