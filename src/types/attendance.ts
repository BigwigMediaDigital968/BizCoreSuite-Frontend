import type { Role } from "./auth";

export const ATTENDANCE_STATUS = {
    PRESENT: "present",
    LATE: "late",
    HALF_DAY: "half_day",
    ABSENT: "absent",
    ON_LEAVE: "on_leave",
} as const;

export type AttendanceStatus =
    (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Present",
  late: "Late",
  half_day: "Half Day",
  absent: "Absent",
  on_leave: "On Leave",
};

/** Values are uppercase to match the backend enum (constants/attendance.ts). */
export const ATTENDANCE_WORK_MODE = {
    WFO: "WFO",
    WFH: "WFH",
} as const;

export type AttendanceWorkMode =
    (typeof ATTENDANCE_WORK_MODE)[keyof typeof ATTENDANCE_WORK_MODE];

export const ATTENDANCE_WORK_MODE_LABELS: Record<AttendanceWorkMode, string> = {
  WFO: "Office",
  WFH: "Remote",
};

export const ATTENDANCE_EVENT = {
    CHECK_IN: "check_in",
    CHECK_OUT: "check_out",
} as const;

export type AttendanceEvent =
    (typeof ATTENDANCE_EVENT)[keyof typeof ATTENDANCE_EVENT];

export interface AttendanceEmployeeRef {
  _id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AttendanceBranchRef {
  _id: string;
  name: string;
  code: string;
}

export interface AttendanceRecord {
  _id: string;
  employee: AttendanceEmployeeRef | string;
  branch: AttendanceBranchRef | string;
  date: string;
  status: AttendanceStatus;
  workMode: AttendanceWorkMode;
  checkInAt?: string;
  checkOutAt?: string;
  checkInLatitude?: number;
  checkInLongitude?: number;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
  checkInDistanceMeters?: number;
  checkOutDistanceMeters?: number;
  lateMinutes: number;
  earlyCheckoutMinutes: number;
  totalWorkingMinutes?: number;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Mirrors attendanceCheckInSchema: workMode is always required, and the
 * backend additionally rejects a WFO check-in that omits coordinates.
 */
export interface CheckInPayload {
    workMode: AttendanceWorkMode;
    latitude?: number;
    longitude?: number;
}

export interface CheckOutPayload {
    latitude?: number;
    longitude?: number;
}

export interface AttendanceListQuery {
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  employeeId?: string;
  branchId?: string;
  status?: AttendanceStatus | "";
  workMode?: AttendanceWorkMode | "";
  page?: number;
  limit?: number;
}

export interface AttendancePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AttendanceListData {
  records: AttendanceRecord[];
  pagination: AttendancePagination;
}

export interface AttendanceSummaryRow {
  employeeId: string;
  name: string;
  email: string;
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  leaveDays: number;
  totalWorkingMinutes: number;
  attendancePercentage: number;
}

export interface AttendanceReportQuery {
  dateFrom: string;
  dateTo: string;
  branchId?: string;
  employeeId?: string;
}