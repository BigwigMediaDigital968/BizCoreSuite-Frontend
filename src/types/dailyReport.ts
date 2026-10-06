/** Mirrors apex--crm-backend/src/constants/dailyReport.ts */
export const DAILY_REPORT_MAX_CUSTOM_FIELDS = 20;

export const DAILY_REPORT_STATUS = {
  SUBMITTED: "SUBMITTED",
  LATE: "LATE",
} as const;

export type DailyReportStatus =
  (typeof DAILY_REPORT_STATUS)[keyof typeof DAILY_REPORT_STATUS];

export const DAILY_REPORT_WINDOW_STATE = {
  NOT_OPEN: "not_open",
  OPEN: "open",
  LATE: "late",
  CLOSED: "closed",
  NON_WORKING_DAY: "non_working_day",
  ON_LEAVE: "on_leave",
} as const;

export type DailyReportWindowState =
  (typeof DAILY_REPORT_WINDOW_STATE)[keyof typeof DAILY_REPORT_WINDOW_STATE];

export interface DailyReportCustomField {
  label: string;
  value: string;
}

export interface DailyReportMetrics {
  callsAttended: number;
  callsAnswered: number;
  conversions: number;
  totalCallDurationSeconds: number;
}

export interface DailyReportSystemMetrics extends DailyReportMetrics {
  computedAt: string;
}

interface PersonRef {
  _id: string;
  name: string;
  email?: string;
}

interface BranchRef {
  _id: string;
  name: string;
  code?: string;
}

export interface DailyReport extends DailyReportMetrics {
  _id: string;
  /** Populated on management endpoints, a bare id on the employee's own. */
  employeeId: PersonRef | string;
  branchId: BranchRef | string;
  reportDate: string;
  workCompleted: string;
  dailyFeedback?: string;
  customFields: DailyReportCustomField[];
  systemMetrics: DailyReportSystemMetrics;
  submittedAt: string;
  status: DailyReportStatus;
  editCount: number;
  review?: {
    reviewedBy?: PersonRef | string;
    reviewedAt?: string;
    remark?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DailyReportWindow {
  date: string;
  timezone: string;
  state: DailyReportWindowState;
  opensAt: string;
  closesAt: string;
  lateUntil: string;
  serverTime: string;
  /** Client-side: server clock minus device clock when the window was fetched. */
  clockOffsetMs: number;
  canSubmit: boolean;
  report: DailyReport | null;
  systemMetrics: DailyReportSystemMetrics;
}

export interface SubmitDailyReportPayload extends DailyReportMetrics {
  workCompleted: string;
  dailyFeedback: string;
  customFields: DailyReportCustomField[];
}

export interface DailyReportListQuery {
  startDate?: string;
  endDate?: string;
  branchId?: string;
  employeeId?: string;
  lateOnly?: boolean;
  mismatchOnly?: boolean;
  reviewed?: boolean;
  page?: number;
  limit?: number;
}

export interface MissingDailyReport {
  employee: PersonRef;
  branch: BranchRef;
  closesAt: string;
  lateUntil: string;
  windowOpen: boolean;
}

export interface MissingDailyReportsResult {
  date: string;
  totals: {
    expected: number;
    submitted: number;
    missing: number;
    onLeave: number;
  };
  missing: MissingDailyReport[];
}

export interface DailyReportSummaryRow extends DailyReportMetrics {
  employee?: PersonRef;
  branch?: BranchRef;
  reports: number;
  lateReports: number;
  systemCallsAttended: number;
  systemConversions: number;
}

export interface DailyReportSummary {
  startDate: string;
  endDate: string;
  rows: DailyReportSummaryRow[];
}

export type DailyReportExportFormat = "csv" | "excel";

// ---------- Display helpers ----------

export const METRIC_FIELDS: {
  key: keyof DailyReportMetrics;
  label: string;
}[] = [
  { key: "callsAttended", label: "Calls attended" },
  { key: "callsAnswered", label: "Calls answered" },
  { key: "conversions", label: "Conversions" },
  { key: "totalCallDurationSeconds", label: "Call duration" },
];

/** Durations are entered in h/m, so sub-minute gaps are rounding, not a mismatch. */
const DURATION_TOLERANCE_SECONDS = 60;

export const isMetricMismatch = (
  key: keyof DailyReportMetrics,
  reported: number,
  system: number
) =>
  key === "totalCallDurationSeconds"
    ? Math.abs(reported - system) > DURATION_TOLERANCE_SECONDS
    : reported !== system;

export const hasMetricMismatch = (report: DailyReport) =>
  METRIC_FIELDS.some(({ key }) =>
    isMetricMismatch(key, report[key], report.systemMetrics?.[key] ?? 0)
  );

export const formatDuration = (seconds: number): string => {
  if (!seconds || seconds <= 0) return "0m";
  const totalMinutes = Math.round(seconds / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

export const formatMetric = (key: keyof DailyReportMetrics, value: number) =>
  key === "totalCallDurationSeconds" ? formatDuration(value) : String(value);

export const refName = (ref: PersonRef | BranchRef | string | undefined) =>
  ref && typeof ref === "object" ? ref.name : "—";
