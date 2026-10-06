import type { PermissionsByRole } from "@/types/auth";
import { apiClient } from "./apiClient";

interface PermissionsResponse {
  success: boolean;
  data: PermissionsByRole;
}

export const permissionApi = {
  getAll: async (): Promise<PermissionsByRole> => {
    const response = await apiClient.get<PermissionsResponse>(
      "/permissions"
    );

    return response.data.data;
  },
};

