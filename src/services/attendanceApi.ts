import type { AttendanceListData, AttendanceListQuery, AttendanceRecord, AttendanceReportQuery, AttendanceSummaryRow, CheckInPayload, CheckOutPayload } from "@/types/attendance";
import { apiClient } from "./apiClient";
import type { ApiEnvelope } from "./apiEnvelope";

export const attendanceApi = {
  /**
   * Get attendance records
   */
  list: async (query: AttendanceListQuery = {}): Promise<AttendanceListData> => {
    const { data } = await apiClient.get<ApiEnvelope<AttendanceListData>>(
      "/attendance",
      { params: query }
    );
    return data.data;
  },

  /**
   * Check in employee
   */
  checkIn: async (payload: CheckInPayload) => {
    const { data } = await apiClient.post<ApiEnvelope<{ attendance: AttendanceRecord }>>(
      "/attendance/check-in",
      payload
    );

    return data.data.attendance;
  },

  /**
   * Check out employee
   */
  checkOut: async (payload: CheckOutPayload) => {
    const { data } = await apiClient.post<
      ApiEnvelope<{ attendance: AttendanceRecord }>
    >("/attendance/check-out", payload);

    return data.data.attendance;
  },

  /**
   * Get attendance report / team summary
   */
  reportSummary: async (
    query: AttendanceReportQuery
  ): Promise<AttendanceSummaryRow[]> => {
    const { data } = await apiClient.get<ApiEnvelope<AttendanceSummaryRow[]>>(
      "/attendance/reports/summary",
      { params: query }
    );
    return data.data;
  },
};