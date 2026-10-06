import { apiClient } from "./apiClient";
import type { ApiEnvelope } from "./apiEnvelope";
import type {
  Branch,
  BranchAttendanceConfig,
  BranchFormInput,
  UpdateBranchAttendanceConfigInput,
} from "@/types/branch";

interface BranchAttendanceConfigResponse {
  branch: {
    id: string;
    name: string;
    code: string;
    isActive: boolean;
  };
  attendanceConfig: BranchAttendanceConfig;
}

export const branchApi = {
  list: async () => {
    const { data } = await apiClient.get<ApiEnvelope<Branch[]>>("/branches");
    return data.data;
  },

  create: async (payload: BranchFormInput) => {
    const { data } = await apiClient.post<ApiEnvelope<Branch>>(
      "/branches",
      payload
    );
    return data.data;
  },

  update: async (id: string, payload: Partial<BranchFormInput>) => {
    const { data } = await apiClient.patch<ApiEnvelope<Branch>>(
      `/branches/${id}`,
      payload
    );
    return data.data;
  },

  updateStatus: async (id: string, isActive: boolean) => {
    const { data } = await apiClient.patch<ApiEnvelope<Branch>>(
      `/branches/${id}/status`,
      { isActive }
    );
    return data.data;
  },

  getAttendanceConfig: async (id: string) => {
    const { data } = await apiClient.get
      <ApiEnvelope<BranchAttendanceConfigResponse>
    >(`/branches/${id}/attendance-config`);
    return data.data;
  },

  updateAttendanceConfig: async (
    id: string,
    payload: UpdateBranchAttendanceConfigInput
  ) => {
    const { data } = await apiClient.patch<ApiEnvelope<BranchAttendanceConfig>>(
      `/branches/${id}/attendance-config`,
      payload
    );
    return data.data;
  },
};