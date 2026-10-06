import { apiClient } from "./apiClient";
import type { ApiEnvelope, PaginatedApiEnvelope } from "./apiEnvelope";
import type { Pagination } from "@/types/employee";
import type {
  DailyReport,
  DailyReportExportFormat,
  DailyReportListQuery,
  DailyReportSummary,
  DailyReportWindow,
  MissingDailyReportsResult,
  SubmitDailyReportPayload,
} from "@/types/dailyReport";

const filenameFromDisposition = (header?: string) =>
  header?.match(/filename="?([^";]+)"?/)?.[1];

export const dailyReportApi = {
  // ---------- Employee ----------

  getWindow: async () => {
    const { data } = await apiClient.get<
      ApiEnvelope<Omit<DailyReportWindow, "clockOffsetMs">>
    >("/daily-reports/window");
    // An older backend returns a different shape; fail into the page's error
    // state instead of crashing the render.
    if (!data.data?.date || !data.data.state) {
      throw new Error("Unexpected daily report window response");
    }
    return {
      ...data.data,
      clockOffsetMs: new Date(data.data.serverTime).getTime() - Date.now(),
    } satisfies DailyReportWindow;
  },

  submit: async (payload: SubmitDailyReportPayload) => {
    const { data } = await apiClient.post<ApiEnvelope<DailyReport>>(
      "/daily-reports",
      payload
    );
    return data;
  },

  listMine: async (query: { page?: number; limit?: number } = {}) => {
    const { data } = await apiClient.get<PaginatedApiEnvelope<DailyReport>>(
      "/daily-reports/my",
      { params: query }
    );
    return { reports: data.data, pagination: data.pagination as Pagination };
  },

  // ---------- Management ----------

  list: async (query: DailyReportListQuery = {}) => {
    const { data } = await apiClient.get<PaginatedApiEnvelope<DailyReport>>(
      "/daily-reports",
      { params: query }
    );
    return { reports: data.data, pagination: data.pagination as Pagination };
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiEnvelope<DailyReport>>(
      `/daily-reports/${id}`
    );
    return data.data;
  },

  review: async (id: string, remark?: string) => {
    const { data } = await apiClient.patch<ApiEnvelope<DailyReport>>(
      `/daily-reports/${id}/review`,
      { remark: remark || undefined }
    );
    return data.data;
  },

  missing: async (query: { date: string; branchId?: string }) => {
    const { data } = await apiClient.get<ApiEnvelope<MissingDailyReportsResult>>(
      "/daily-reports/missing",
      { params: query }
    );
    return data.data;
  },

  summary: async (query: {
    startDate: string;
    endDate: string;
    branchId?: string;
  }) => {
    const { data } = await apiClient.get<ApiEnvelope<DailyReportSummary>>(
      "/daily-reports/summary",
      { params: query }
    );
    return data.data;
  },

  exportReports: async (
    query: Omit<DailyReportListQuery, "page" | "limit">,
    format: DailyReportExportFormat
  ) => {
    const response = await apiClient.get<Blob>("/daily-reports/export", {
      params: { ...query, format },
      responseType: "blob",
    });

    return {
      blob: response.data,
      filename:
        filenameFromDisposition(response.headers["content-disposition"]) ??
        `daily-reports.${format === "excel" ? "xlsx" : "csv"}`,
    };
  },
};
