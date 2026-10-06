import { apiClient } from "./apiClient";
import type { ApiEnvelope } from "./apiEnvelope";
import type {
  Holiday,
  CreateHolidayInput,
  UpdateHolidayInput,
} from "@/types/holiday";

export const holidayApi = {
  getByBranch: async (branchId: string, year?: number) => {
    const { data } = await apiClient.get<ApiEnvelope<Holiday[]>>(
      `/holidays/branch/${branchId}`,
      {
        params: year ? { year } : undefined,
      }
    );
    return data.data;
  },

  create: async (payload: CreateHolidayInput) => {
    const { data } = await apiClient.post<ApiEnvelope<Holiday>>(
      "/holidays",
      payload
    );
    return data.data;
  },

  update: async (id: string, payload: UpdateHolidayInput) => {
    const { data } = await apiClient.patch<ApiEnvelope<Holiday>>(
      `/holidays/${id}`,
      payload
    );
    return data.data;
  },

  delete: async (id: string) => {
    const { data } = await apiClient.delete<ApiEnvelope<Holiday>>(
      `/holidays/${id}`
    );
    return data.data;
  },
};