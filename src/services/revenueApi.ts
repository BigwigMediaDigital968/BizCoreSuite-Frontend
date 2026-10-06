import { apiClient } from "./apiClient";
import type { ApiEnvelope } from "./apiEnvelope";
import type {
  CreateRevenuePayload,
  RevenueRecord,
  RevenueReportParams,
  RevenueReportResponse,
  UpdateRevenuePayload,
  UpdateRevenueStatusPayload,
} from "@/types/revenue";

export const revenueApi = {
  /**
   * GET /revenue/report
   */
  getReport: async (params: RevenueReportParams): Promise<RevenueReportResponse> => {
    const { data } = await apiClient.get<ApiEnvelope<RevenueReportResponse>>(
      "/revenue/report",
      { params }
    );
    return data.data;
  },

  /**
   * POST /revenue
   */
  create: async (payload: CreateRevenuePayload): Promise<RevenueRecord> => {
    const { data } = await apiClient.post<ApiEnvelope<RevenueRecord>>(
      "/revenue",
      payload
    );
    return data.data;
  },

  /**
   * PATCH /revenue/:id
   */
  update: async (id: string, payload: UpdateRevenuePayload): Promise<RevenueRecord> => {
    const { data } = await apiClient.patch<ApiEnvelope<RevenueRecord>>(
      `/revenue/${id}`,
      payload
    );
    return data.data;
  },

  /**
   * PATCH /revenue/:id/status
   */
  updateStatus: async (
    id: string,
    payload: UpdateRevenueStatusPayload
  ): Promise<RevenueRecord> => {
    const { data } = await apiClient.patch<ApiEnvelope<RevenueRecord>>(
      `/revenue/${id}/status`,
      payload
    );
    return data.data;
  },
};