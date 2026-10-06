import { apiClient } from "@/services/apiClient";
import type {
  ActivityLog,
  ActivityLogQueryParams,
  ActivityLogResponse,
  PaginationMeta,
} from "@/types/activityLog";

export interface ActivityLogListData {
  logs: ActivityLog[];
  pagination: PaginationMeta;
}

export const fetchAuditLogs = async (
  params: ActivityLogQueryParams,
): Promise<ActivityLogListData> => {
  const { data } = await apiClient.get<ActivityLogResponse>("/activity-logs", {
    params,
  });

  return {
    logs: data.data || [],
    pagination: data.pagination,
  };
};
