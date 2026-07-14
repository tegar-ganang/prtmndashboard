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
  lcv_project_charter_budaya: "lcv",
  lcv_monitoring: "lcv",
};

function getEndpoint(docType: string): string {
  return DOC_TYPE_ENDPOINT_MAP[docType.toLowerCase()] ?? docType.toLowerCase();
}

export function useMonitoringData(docType: string, params: MonitoringParams) {
  const endpoint = getEndpoint(docType);

  const docTypeUpper = docType.toUpperCase();
  const isLcv = docTypeUpper.startsWith("LCV_");

  return useQuery({
    queryKey: ["monitoring", docType, params],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/${endpoint}`, {
        params: {
          doc_type: isLcv ? docTypeUpper : undefined,
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
    staleTime: 3 * 60 * 1000, // Data fresh for 3 minutes
    gcTime: 10 * 60 * 1000,  // Keep cache in memory for 10 minutes
  });
}


export function useMonitoringHistory(docType: string, customDocType?: string | null) {
  const endpoint = getEndpoint(docType);

  const docTypeUpper = docType.toUpperCase();

  return useQuery({
    queryKey: ["monitoring-history", docType, customDocType],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/${endpoint}/history`, {
        params: {
          doc_type: customDocType?.toUpperCase() || (docTypeUpper.startsWith("LCV_") ? docTypeUpper : undefined),
        },
      });
      return data.data;
    },
    enabled: !!docType,
  });
}


