import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/services/api/main/interceptor";

interface MonitoringParams {
  batch_id?: string | null;
  year?: number | null;
  month?: number | null;
  quarter?: number | null;
  field?: string | null;
}

// Map dari docType slug ke base endpoint path
// Produksi pakai /produksi (beda dengan pattern /{docType} lainnya)
const DOC_TYPE_ENDPOINT_MAP: Record<string, string> = {
  produksi: "produksi",
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
