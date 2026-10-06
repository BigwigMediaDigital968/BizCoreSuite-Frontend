export type ActivityModule =
  | "USER"
  | "EMPLOYEE"
  | "BRANCH"
  | "HOLIDAY"
  | "ATTENDANCE"
  | "LEAVE"
  | "LEAD"
  | "LEAD_ACTIVITY"
  | "LEAD_FOLLOWUP"
  | "CUSTOMER"
  | "TASK"
  | "STRINGEE"
  | "CALL_LOG"
  | "REVENUE"
  | "SALARY"
  | "ACHIEVEMENT"
  | "PERFORMANCE"
  | "INCENTIVE"
  | "REPORT"
  | "SYSTEM";

export interface ActivityUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface ActivityBranch {
  _id: string;
  name: string;
  code?: string;
}

export interface ActivityLog {
  _id: string;
  module: ActivityModule;
  action: string;
  description: string;
  performedBy: ActivityUser | null;
  entityId?: string;
  branch?: ActivityBranch | null;
  metadata?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

export interface ActivityLogListData {
  logs: ActivityLog[];
  pagination: PaginationMeta;
}

export interface ActivityLogQueryParams {
  page?: number;
  limit?: number;
  module?: string;
  action?: string;
  userId?: string;
  branchId?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ActivityLogResponse {
  success: boolean;
  data: ActivityLog[];
  pagination: PaginationMeta;
}
