import { apiClient } from "./apiClient";
import type { ApiEnvelope, PaginatedApiEnvelope } from "./apiEnvelope";
import type { Pagination } from "@/types/employee";
import type {
  CreateDeductionPayload,
  Decision,
  DeductionListQuery,
  EligibleEmployee,
  ExportFormat,
  PayoutInput,
  PayoutListQuery,
  PayoutPreview,
  PayoutTotals,
  MyPayoutSummary,
  Payslip,
  SalaryDeduction,
  SalaryPayout,
  SalaryPayoutSummary,
  SalarySettings,
  SalarySettingsValues,
} from "@/types/salary";

const filenameFromDisposition = (header?: string) =>
  header?.match(/filename="?([^";]+)"?/)?.[1];

export const salaryApi = {
  // ---------- Self-service ----------

  listMine: async (query: { page?: number; limit?: number } = {}) => {
    const { data } = await apiClient.get<PaginatedApiEnvelope<MyPayoutSummary>>(
      "/salary/my/payouts",
      { params: query }
    );
    return { payouts: data.data, pagination: data.pagination as Pagination };
  },

  getMine: async (id: string) => {
    const { data } = await apiClient.get<ApiEnvelope<Payslip>>(
      `/salary/my/payouts/${id}`
    );
    return data.data;
  },

  // ---------- Settings ----------

  getSettings: async () => {
    const { data } = await apiClient.get<ApiEnvelope<SalarySettings>>(
      "/salary/settings"
    );
    return data.data;
  },

  updateSettings: async (payload: SalarySettingsValues) => {
    const { data } = await apiClient.put<ApiEnvelope<SalarySettings>>(
      "/salary/settings",
      payload
    );
    return data;
  },

  resetSettings: async () => {
    const { data } = await apiClient.delete<ApiEnvelope<SalarySettings>>(
      "/salary/settings"
    );
    return data;
  },

  // ---------- Payouts ----------

  eligible: async (query: { from: string; to: string; branchId?: string }) => {
    const { data } = await apiClient.get<ApiEnvelope<EligibleEmployee[]>>(
      "/salary/payouts/eligible",
      { params: query }
    );
    return data.data;
  },

  preview: async (payload: PayoutInput) => {
    const { data } = await apiClient.post<ApiEnvelope<PayoutPreview>>(
      "/salary/payouts/preview",
      payload
    );
    return data.data;
  },

  generate: async (payload: PayoutInput) => {
    const { data } = await apiClient.post<
      ApiEnvelope<{ _id: string; payoutNo: string; totals: PayoutTotals }>
    >("/salary/payouts", payload);
    return data;
  },

  listPayouts: async (query: PayoutListQuery = {}) => {
    const { data } = await apiClient.get<
      PaginatedApiEnvelope<SalaryPayoutSummary>
    >("/salary/payouts", { params: query });
    return { payouts: data.data, pagination: data.pagination as Pagination };
  },

  getPayout: async (id: string) => {
    const { data } = await apiClient.get<ApiEnvelope<SalaryPayout>>(
      `/salary/payouts/${id}`
    );
    return data.data;
  },

  markPaid: async (id: string) => {
    const { data } = await apiClient.patch<ApiEnvelope<SalaryPayout>>(
      `/salary/payouts/${id}/paid`
    );
    return data;
  },

  cancel: async (id: string, reason: string) => {
    const { data } = await apiClient.patch<ApiEnvelope<SalaryPayout>>(
      `/salary/payouts/${id}/cancel`,
      { reason }
    );
    return data;
  },

  exportPayout: async (id: string, format: ExportFormat) => {
    const response = await apiClient.get<Blob>(`/salary/payouts/${id}/export`, {
      params: { format },
      responseType: "blob",
    });
    return {
      blob: response.data,
      filename:
        filenameFromDisposition(response.headers["content-disposition"]) ??
        `payout.${format === "excel" ? "xlsx" : "csv"}`,
    };
  },

  // ---------- Deductions ----------

  listDeductions: async (query: DeductionListQuery = {}) => {
    const { data } = await apiClient.get<PaginatedApiEnvelope<SalaryDeduction>>(
      "/salary/deductions",
      { params: query }
    );
    return { deductions: data.data, pagination: data.pagination as Pagination };
  },

  createDeduction: async (payload: CreateDeductionPayload) => {
    const { data } = await apiClient.post<ApiEnvelope<SalaryDeduction>>(
      "/salary/deductions",
      payload
    );
    return data;
  },

  reviewDeduction: async (id: string, status: Decision, remark?: string) => {
    const { data } = await apiClient.patch<ApiEnvelope<SalaryDeduction>>(
      `/salary/deductions/${id}/review`,
      { status, remark: remark || undefined }
    );
    return data;
  },

  deleteDeduction: async (id: string) => {
    const { data } = await apiClient.delete<ApiEnvelope<null>>(
      `/salary/deductions/${id}`
    );
    return data;
  },
};
