import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/services/api/main/interceptor";

interface MonitoringParams {
  batch_id?: string | null;
  year?: number | null;
  month?: number | null;
  quarter?: number | null;
  field?: string | null;
  zona?: string | null;
}

// Map dari docType slug ke base endpoint path
const DOC_TYPE_ENDPOINT_MAP: Record<string, string> = {
  produksi: "produksi",
  zona_indicator: "zona-indicator",
  zona_pse_list: "zona-pse-list",
};

function getEndpoint(docType: string): string {
  return DOC_TYPE_ENDPOINT_MAP[docType.toLowerCase()] ?? docType.toLowerCase();
}

export function useMonitoringData(docType: string, params: MonitoringParams) {
  const endpoint = getEndpoint(docType);

  return useQuery({
    queryKey: ["monitoring", docType, params],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/${endpoint}`, {
        params: {
          batch_id: params.batch_id,
          year: params.year,
          month: params.month,
          quarter: params.quarter,
          field: params.field,
          zona: params.zona,
        },
      });
      return data.data;
    },
    enabled: !!docType,
  });
}


export function useMonitoringHistory(docType: string) {
  const endpoint = getEndpoint(docType);

  return useQuery({
    queryKey: ["monitoring-history", docType],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/${endpoint}/history`);
      return data.data;
    },
    enabled: !!docType,
  });
}
