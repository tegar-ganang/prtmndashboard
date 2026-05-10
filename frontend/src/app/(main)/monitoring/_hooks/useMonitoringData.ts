import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/services/api/main/interceptor";

interface MonitoringParams {
  batch_id?: string | null;
  year?: number | null;
  month?: number | null;
  quarter?: number | null;
}

export function useMonitoringData(docType: string, params: MonitoringParams) {
  return useQuery({
    queryKey: ["monitoring", docType, params],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/api/${docType.toLowerCase()}`, {
        params: {
          batch_id: params.batch_id,
          year: params.year,
          month: params.month,
          quarter: params.quarter,
        },
      });
      return data.data;
    },
    enabled: !!docType,
  });
}

export function useMonitoringHistory(docType: string) {
  return useQuery({
    queryKey: ["monitoring-history", docType],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/api/${docType.toLowerCase()}/history`);
      return data.data;
    },
    enabled: !!docType,
  });
}
