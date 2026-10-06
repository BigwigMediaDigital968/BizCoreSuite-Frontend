import { apiClient } from "@/services/apiClient";
import type {
  AuditLogListData,
  AuditLogListResponse,
  AuditLogQueryParams,
} from "@/types/audit";

export const fetchAuditLogs = async (
  params: AuditLogQueryParams,
): Promise<AuditLogListData> => {
  const { data } = await apiClient.get<AuditLogListResponse>("/audit-logs", {
    params,
  });

  return data.data;
};