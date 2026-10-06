export const REVENUE_STATUS = {
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
} as const;

export type RevenueStatus = (typeof REVENUE_STATUS)[keyof typeof REVENUE_STATUS];

/** "" is the page's "All" filter; it is sent to the API as "ALL". */
export type RevenueViewMode = "ALL" | "INDIVIDUAL" | "TEAM" | "BRANCH" | "LEAD" | "";

export interface RevenueEmployeeRef {
  _id: string;
  name: string;
  email: string;
}

export interface RevenueBranchRef {
  _id: string;
  name: string;
  code: string;
}

export interface RevenueLeadRef {
  _id: string;
  name: string; // backend populate now correctly selects `name`, not `title`
  status: string;
}

export interface RevenueRecord {
  _id: string;
  employee: RevenueEmployeeRef;
  branch: RevenueBranchRef;
  lead?: RevenueLeadRef;
  date: string;
  amount: number;
  source: string;
  clientName: string;
  clientContact?: string;
  reference?: string;
  notes?: string;
  status: RevenueStatus;
  verifiedBy?: { _id: string; name: string };
  verifiedAt?: string;
  lastEditedBy?: { _id: string; name: string };
  lastEditedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface RevenueReportParams {
  targetUserId?: string;
  employeeId?: string;
  branchId?: string;
  leadId?: string;
  status?: RevenueStatus;
  startDate?: string;
  endDate?: string;
  viewMode?: RevenueViewMode;
}

/** Status-bucketed totals — returned for INDIVIDUAL / TEAM / BRANCH view modes. */
export interface RevenueStatusSummary {
  _id: RevenueStatus;
  totalAmount: number;
  count: number;
}

/** Flat total — returned only for the LEAD view mode shortcut. */
export interface RevenueLeadSummary {
  totalAmount: number;
  count: number;
}

export interface RevenueReportResponse {
  scope: Record<string, unknown>;
  period?: { startDate: string; endDate: string };
  summary: RevenueStatusSummary[] | RevenueLeadSummary;
  records: RevenueRecord[];
}

export interface CreateRevenuePayload {
  employeeId?: string;
  branchId?: string;
  leadId?: string;
  date?: string;
  amount: number;
  source: string;
  clientName: string;
  clientContact?: string;
  reference?: string;
  notes?: string;
}

/** Empty string on an optional text field clears it. */
export interface UpdateRevenuePayload {
  date?: string;
  amount?: number;
  source?: string;
  clientName?: string;
  clientContact?: string;
  reference?: string;
  notes?: string;
}

export interface UpdateRevenueStatusPayload {
  status: typeof REVENUE_STATUS.VERIFIED | typeof REVENUE_STATUS.REJECTED;
  notes?: string;
}