// import { keepPreviousData, useQuery } from "@tanstack/react-query";
// import type { AuditLogQueryParams } from "@/types/audit";
// import { fetchAuditLogs } from "@/services/auditApi";

// export const auditLogsQueryKey = (params: AuditLogQueryParams) =>
//   ["audit-logs", params] as const;

// export const useAuditLogs = (params: AuditLogQueryParams) => {
//   return useQuery({
//     queryKey: auditLogsQueryKey(params),
//     queryFn: () => fetchAuditLogs(params),
//     placeholderData: keepPreviousData,
//   });
// };

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type {
  ActivityLogQueryParams,
  ActivityLogListData,
} from "@/types/activityLog";
import { fetchAuditLogs } from "@/services/apiActivity";

export const auditLogsQueryKey = (params: ActivityLogQueryParams) =>
  ["audit-logs", params] as const;

export const useAuditLogs = (params: ActivityLogQueryParams) => {
  return useQuery<ActivityLogListData>({
    queryKey: auditLogsQueryKey(params),
    queryFn: () => fetchAuditLogs(params),
    placeholderData: keepPreviousData,
  });
};
