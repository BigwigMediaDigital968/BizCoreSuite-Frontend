import { apiClient } from "./apiClient";
import type { ApiEnvelope, PaginatedApiEnvelope } from "./apiEnvelope";
import type {
  CreateEmployeeInput,
  CreateEmployeeProfilePayload,
  Employee,
  EmployeeListQuery,
  EmployeeMutationResult,
  EmployeeProfile,
  EmployeeProfileListQuery,
  Pagination,
  UpdateEmployeeInput,
} from "@/types/employee";

export const employeeApi = {
  // ---------- User (account) endpoints ----------

  list: async (query: EmployeeListQuery = {}) => {
    const { data } = await apiClient.get<PaginatedApiEnvelope<Employee>>(
      "/users",
      { params: query }
    );
    return { employees: data.data, pagination: data.pagination as Pagination };
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiEnvelope<Employee>>(`/users/${id}`);
    return data.data;
  },

  create: async (payload: CreateEmployeeInput) => {
    const { data } = await apiClient.post<ApiEnvelope<EmployeeMutationResult>>(
      "/users",
      payload
    );
    return data.data;
  },

  update: async (id: string, payload: UpdateEmployeeInput) => {
    const { data } = await apiClient.patch<ApiEnvelope<EmployeeMutationResult>>(
      `/users/${id}`,
      payload
    );
    return data.data;
  },

  updateStatus: async (id: string, isActive: boolean) => {
    const { data } = await apiClient.patch<ApiEnvelope<EmployeeMutationResult>>(
      `/users/${id}/status`,
      { isActive }
    );
    return data.data;
  },

  updateBranches: async (id: string, branches: string[]) => {
    const { data } = await apiClient.patch<ApiEnvelope<EmployeeMutationResult>>(
      `/users/${id}/branches`,
      { branches }
    );
    return data.data;
  },

  // ---------- EmployeeProfile endpoints ----------

  listProfiles: async (query: EmployeeProfileListQuery = {}) => {
    const { data } = await apiClient.get<PaginatedApiEnvelope<EmployeeProfile>>(
      "/employee",
      { params: query }
    );
    return {
      profiles: data.data,
      pagination: data.pagination as Pagination,
    };
  },

  getProfile: async (id: string) => {
    const { data } = await apiClient.get<ApiEnvelope<EmployeeProfile>>(
      `/employee/${id}`
    );
    return data.data;
  },

  createProfile: async (payload: CreateEmployeeProfilePayload) => {
    const { data } = await apiClient.post<ApiEnvelope<EmployeeProfile>>(
      "/employee",
      payload
    );
    return data.data;
  },

  /**
   * Soft "save" — the backend currently exposes POST /employee for create and
   * GET /employee[/:id] for reads, but no PATCH route for updates. We re-submit
   * the full payload via POST; the hook guards against duplicate profiles
   * before calling this. The `id` arg is accepted for API parity with the
   * future PATCH route so callers don't need to change once it ships.
   */
  updateProfile: async (_id: string, payload: CreateEmployeeProfilePayload) => {
    const { data } = await apiClient.patch<ApiEnvelope<EmployeeProfile>>(
      `/employee/${_id}`,
      payload
    );
    return data.data;
  },
};
