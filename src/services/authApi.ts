import { apiClient } from "./apiClient";
import type { AuthUser, LoginPayload, LoginResponse } from "@/types/auth";

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface LateCheckInPayload {
  /** Short-lived token from the login 403 response — proves identity without a full access token. */
  lockoutToken: string;
  reason: string;
}

export interface LateCheckInResponseData {
  _id: string;
  employee: string;
  branch: string;
  requestDate: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
}

export const authApi = {
  login: async (payload: LoginPayload) => {
    const { data } = await apiClient.post<ApiEnvelope<LoginResponse>>(
      "/auth/login",
      payload
    );
    return data.data;
  },

  me: async () => {
    const { data } = await apiClient.get<ApiEnvelope<{ user: AuthUser }>>(
      "/auth/me"
    );
    return data.data.user;
  },

  logout: async (refreshToken: string) => {
    await apiClient.post("/auth/logout", { refreshToken });
  },

  /** Self-service profile update — name only. Email changes are admin-managed. */
  updateMe: async (payload: { name: string }) => {
    const { data } = await apiClient.patch<ApiEnvelope<{ user: AuthUser }>>(
      "/auth/me",
      payload
    );
    return data.data.user;
  },

  changePassword: async (payload: {
    currentPassword: string;
    newPassword: string;
  }) => {
    await apiClient.patch("/auth/me/password", payload);
  },

  /**
   * Head/Admin reset of another user's password. No current password is sent —
   * the actor never knows it; the API authorizes on `user:update` instead.
   */
  resetUserPassword: async (userId: string, payload: { newPassword: string }) => {
    await apiClient.patch(`/auth/update-password/${userId}`, payload);
  },
};

export const lateCheckInApi = {
  submitReason: async (payload: LateCheckInPayload) => {
    const { data } = await apiClient.post<ApiEnvelope<LateCheckInResponseData>>(
      "/late-checkin/submit-reason",
      payload
    );
    return data.data;
  },
};