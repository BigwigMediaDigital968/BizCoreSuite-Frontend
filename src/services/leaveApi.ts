import { apiClient } from "./apiClient";
import type { ApiEnvelope, PaginatedApiEnvelope } from "./apiEnvelope";
import type { Pagination } from "@/types/employee";
import type {
  AdjustLeaveBalancePayload,
  AllocateLeaveBalancePayload,
  CreateLeavePolicyPayload,
  CreateLeaveRequestPayload,
  LeaveBalance,
  LeaveBalanceTransaction,
  LeavePolicy,
  LeavePolicyListQuery,
  LeaveRequest,
  LeaveRequestListQuery,
  RejectLeaveRequestPayload,
  UpdateLeavePolicyPayload,
  UpdateLeaveRequestPayload,
} from "@/types/leave";

export const leaveApi = {
  // ---------- Leave requests (/leaves) ----------

  list: async (query: LeaveRequestListQuery = {}) => {
    const { data } = await apiClient.get<PaginatedApiEnvelope<LeaveRequest>>(
      "/leaves",
      { params: query }
    );
    return { requests: data.data, pagination: data.pagination as Pagination };
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiEnvelope<LeaveRequest>>(
      `/leaves/${id}`
    );
    return data.data;
  },

  create: async (payload: CreateLeaveRequestPayload) => {
    const { data } = await apiClient.post<ApiEnvelope<LeaveRequest>>(
      "/leaves",
      payload
    );
    return data.data;
  },

  update: async (id: string, payload: UpdateLeaveRequestPayload) => {
    const { data } = await apiClient.patch<ApiEnvelope<LeaveRequest>>(
      `/leaves/${id}`,
      payload
    );
    return data.data;
  },

  cancel: async (id: string) => {
    const { data } = await apiClient.post<ApiEnvelope<LeaveRequest>>(
      `/leaves/${id}/cancel`
    );
    return data.data;
  },

  approve: async (id: string) => {
    const { data } = await apiClient.post<ApiEnvelope<LeaveRequest>>(
      `/leaves/${id}/approve`
    );
    return data.data;
  },

  reject: async (id: string, payload: RejectLeaveRequestPayload) => {
    const { data } = await apiClient.post<ApiEnvelope<LeaveRequest>>(
      `/leaves/${id}/reject`,
      payload
    );
    return data.data;
  },

  // ---------- Leave policies (/leave-policies) ----------

  listPolicies: async (query: LeavePolicyListQuery = {}) => {
    const { data } = await apiClient.get<
      ApiEnvelope<{ policies: LeavePolicy[]; pagination: Pagination }>
    >("/leave-policies", { params: query });
    return data.data;
  },

  getPolicy: async (id: string) => {
    const { data } = await apiClient.get<
      ApiEnvelope<{ policy: LeavePolicy }>
    >(`/leave-policies/${id}`);
    return data.data.policy;
  },

  createPolicy: async (payload: CreateLeavePolicyPayload) => {
    const { data } = await apiClient.post<ApiEnvelope<{ policy: LeavePolicy }>>(
      "/leave-policies",
      payload
    );
    return data.data.policy;
  },

  updatePolicy: async (id: string, payload: UpdateLeavePolicyPayload) => {
    const { data } = await apiClient.patch<ApiEnvelope<{ policy: LeavePolicy }>>(
      `/leave-policies/${id}`,
      payload
    );
    return data.data.policy;
  },

  deactivatePolicy: async (id: string) => {
    const { data } = await apiClient.patch<ApiEnvelope<{ policy: LeavePolicy }>>(
      `/leave-policies/${id}/deactivate`
    );
    return data.data.policy;
  },

  // ---------- Leave balances (/leave-balances) ----------

  /** Own balances — the backend scopes this to the caller. */
  myBalances: async (year?: number) => {
    const { data } = await apiClient.get<ApiEnvelope<LeaveBalance[]>>(
      "/leave-balances",
      { params: year ? { year } : undefined }
    );
    return data.data;
  },

  employeeBalances: async (employeeId: string, year?: number) => {
    const { data } = await apiClient.get<ApiEnvelope<LeaveBalance[]>>(
      `/leave-balances/${employeeId}`,
      { params: year ? { year } : undefined }
    );
    return data.data;
  },

  balanceTransactions: async (employeeId: string, leaveBalanceId?: string) => {
    const { data } = await apiClient.get<
      ApiEnvelope<LeaveBalanceTransaction[]>
    >(`/leave-balances/${employeeId}/transactions`, {
      params: leaveBalanceId ? { leaveBalanceId } : undefined,
    });
    return data.data;
  },

  allocateBalance: async (payload: AllocateLeaveBalancePayload) => {
    const { data } = await apiClient.post<
      ApiEnvelope<{ balance: LeaveBalance }>
    >("/leave-balances/allocate", payload);
    return data.data.balance;
  },

  adjustBalance: async (
    leaveBalanceId: string,
    payload: AdjustLeaveBalancePayload
  ) => {
    const { data } = await apiClient.post<ApiEnvelope<LeaveBalance>>(
      `/leave-balances/${leaveBalanceId}/adjust`,
      payload
    );
    return data.data;
  },
};
