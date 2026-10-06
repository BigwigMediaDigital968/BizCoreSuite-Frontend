import { apiClient } from "./apiClient";
import type { ApiEnvelope } from "./apiEnvelope";
import type {
  AssignStringeeNumberInput,
  CreateStringeeNumberInput,
  StringeeNumber,
  UpdateStringeeNumberInput,
} from "@/types/stringeeNumber";

export const stringeeNumberApi = {
  list: async () => {
    const { data } = await apiClient.get<ApiEnvelope<StringeeNumber[]>>(
      "/stringee-numbers/list",
    );
    return data.data;
  },

  create: async (payload: CreateStringeeNumberInput) => {
    const { data } = await apiClient.post<ApiEnvelope<StringeeNumber>>(
      "/stringee-numbers/add",
      payload,
    );
    return data.data;
  },

  update: async (numberId: string, payload: UpdateStringeeNumberInput) => {
    const { data } = await apiClient.put<ApiEnvelope<StringeeNumber>>(
      `/stringee-numbers/${numberId}`,
      payload,
    );
    return data;
  },

  // ✅ Fetch current logged-in employee's active assignment details
  getMyAssignment: async () => {
    const { data } = await apiClient.get<ApiEnvelope<StringeeNumber | null>>(
      "/stringee-numbers/my-assignment",
    );
    return data.data;
  },

  // ✅ Updated: Accepts numberId and the full payload object
  assign: async (numberId: string, payload: AssignStringeeNumberInput) => {
    const { data } = await apiClient.patch<ApiEnvelope<StringeeNumber>>(
      `/stringee-numbers/${numberId}/assign`,
      payload,
    );
    return data;
  },
};
