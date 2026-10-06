import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { attendanceApi } from "@/services/attendanceApi";

import type {
  AttendanceListQuery,
  AttendanceReportQuery,
  CheckInPayload,
  CheckOutPayload,
} from "@/types/attendance";

/**
 * Query keys
 */

export const attendanceKeys = {
  all: ["attendance"] as const,
  list: (query: AttendanceListQuery) =>
    [...attendanceKeys.all, "list", query] as const,
  summary: (query: AttendanceReportQuery) =>
    [...attendanceKeys.all, "summary", query] as const,
};
 
export const useAttendanceRecords = (query: AttendanceListQuery) =>
  useQuery({
    queryKey: attendanceKeys.list(query),
    queryFn: () => attendanceApi.list(query),
    placeholderData: keepPreviousData,
  });
 
/**
 * Per-employee aggregated stats for a date range — powers both the KPI
 * cards and the "Employee Summary" tab. dateFrom/dateTo are required by the
 * backend, so the query stays disabled until both are present.
 */
export const useAttendanceSummary = (
  query: AttendanceReportQuery,
  enabled = true
) =>
  useQuery({
    queryKey: attendanceKeys.summary(query),
    queryFn: () => attendanceApi.reportSummary(query),
    enabled: enabled && Boolean(query.dateFrom && query.dateTo),
    placeholderData: keepPreviousData,
  });

/**
 * Check in
 */
export const useCheckIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CheckInPayload) =>
      attendanceApi.checkIn(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.all,
      });
    },
  });
};

/**
 * Check out
 */
export const useCheckOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CheckOutPayload) =>
      attendanceApi.checkOut(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.all,
      });
    },
  });
};