import { apiClient } from "./apiClient";
import type { ApiEnvelope } from "./apiEnvelope";
import type { PerformanceQuery, PerformanceReport } from "@/types/performance";

export const performanceApi = {
  getReport: async (query: PerformanceQuery): Promise<PerformanceReport> => {
    const params: Record<string, string> = {};
    if (query.viewMode) params.viewMode = query.viewMode;
    if (query.targetUserId) params.targetUserId = query.targetUserId;
    if (query.branchId) params.branchId = query.branchId;
    if (query.startDate) params.startDate = query.startDate;
    if (query.endDate) params.endDate = query.endDate;

    const { data } = await apiClient.get<ApiEnvelope<PerformanceReport>>(
      "/performance/report",
      { params }
    );
    return data.data;
  },
};