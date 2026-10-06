import type { Role } from "./auth";

// =========================================================================
// Enums — mirror apex--crm-backend/src/constants/leave*.ts
// =========================================================================

/** From constants/leave.ts — the policy's leave category. */
export const LEAVE_TYPE = {
  CASUAL: "casual",
  SICK: "sick",
  EARNED: "earned",
  PAID: "paid",
  UNPAID: "unpaid",
  MATERNITY: "maternity",
  PATERNITY: "paternity",
  COMPENSATORY: "compensatory",
  BEREAVEMENT: "bereavement",
  ANNUAL: "annual",
  OTHER: "other",
} as const;

export type LeaveType = (typeof LEAVE_TYPE)[keyof typeof LEAVE_TYPE];

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  casual: "Casual",
  sick: "Sick",
  earned: "Earned",
  paid: "Paid",
  unpaid: "Unpaid",
  maternity: "Maternity",
  paternity: "Paternity",
  compensatory: "Compensatory",
  bereavement: "Bereavement",
  annual: "Annual",
  other: "Other",
};

/** From constants/leaveRequest.ts. */
export const LEAVE_REQUEST_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
} as const;

export type LeaveRequestStatus =
  (typeof LEAVE_REQUEST_STATUS)[keyof typeof LEAVE_REQUEST_STATUS];

export const LEAVE_REQUEST_STATUS_LABELS: Record<LeaveRequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const LEAVE_DURATION_TYPE = {
  FULL_DAY: "full_day",
  FIRST_HALF: "first_half",
  SECOND_HALF: "second_half",
} as const;

export type LeaveDurationType =
  (typeof LEAVE_DURATION_TYPE)[keyof typeof LEAVE_DURATION_TYPE];

export const LEAVE_DURATION_TYPE_LABELS: Record<LeaveDurationType, string> = {
  full_day: "Full Day",
  first_half: "First Half",
  second_half: "Second Half",
};

/** From constants/leaveBalance.ts. */
export const LEAVE_BALANCE_TRANSACTION_TYPE = {
  CREDIT: "credit",
  DEBIT: "debit",
  RESTORE: "restore",
  ADJUSTMENT: "adjustment",
  RESERVE: "reserve",
  RELEASE: "release",
} as const;

export type LeaveBalanceTransactionType =
  (typeof LEAVE_BALANCE_TRANSACTION_TYPE)[keyof typeof LEAVE_BALANCE_TRANSACTION_TYPE];

export const LEAVE_BALANCE_TRANSACTION_SOURCE = {
  POLICY_ALLOCATION: "policy_allocation",
  LEAVE_APPLICATION: "leave_application",
  LEAVE_APPROVAL: "leave_approval",
  LEAVE_CANCELLATION: "leave_cancellation",
  LEAVE_REJECTION: "leave_rejection",
  ADMIN_ADJUSTMENT: "admin_adjustment",
  YEAR_END: "year_end",
} as const;

export type LeaveBalanceTransactionSource =
  (typeof LEAVE_BALANCE_TRANSACTION_SOURCE)[keyof typeof LEAVE_BALANCE_TRANSACTION_SOURCE];

// =========================================================================
// Leave requests
// =========================================================================

export interface LeaveEmployeeRef {
  _id: string;
  name: string;
  email: string;
  role: Role;
}

export interface LeaveBranchRef {
  _id: string;
  name: string;
  code: string;
}

export interface LeavePolicyRef {
  _id: string;
  name: string;
  code: string;
}

export interface LeaveRequest {
  _id: string;
  employee: LeaveEmployeeRef | string;
  branch: LeaveBranchRef | string;
  leavePolicy: LeavePolicyRef | string;
  /** Stored uppercase by the backend. */
  leaveType: string;
  startDate: string;
  endDate: string;
  durationType: LeaveDurationType;
  totalDays: number;
  reason?: string;
  status: LeaveRequestStatus;
  appliedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequestListQuery {
  employeeId?: string;
  branchId?: string;
  leaveType?: string;
  status?: LeaveRequestStatus;
  page?: number;
  limit?: number;
}

export interface CreateLeaveRequestPayload {
  leavePolicyId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  durationType: LeaveDurationType;
  reason?: string;
}

export type UpdateLeaveRequestPayload = Partial<CreateLeaveRequestPayload>;

export interface RejectLeaveRequestPayload {
  /** Backend requires 3-2000 characters. */
  rejectionReason: string;
}

// =========================================================================
// Leave policies
// =========================================================================

export interface LeavePolicy {
  _id: string;
  name: string;
  code: string;
  leaveType: LeaveType;
  branch?: LeaveBranchRef | string | null;
  annualAllocation: number;
  isPaid: boolean;
  allowHalfDay: boolean;
  allowCarryForward: boolean;
  maximumCarryForward?: number | null;
  allowNegativeBalance: boolean;
  minimumNoticeDays: number;
  maximumConsecutiveDays?: number | null;
  applicableFrom: string;
  applicableTo?: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeavePolicyListQuery {
  branch?: string;
  leaveType?: LeaveType;
  /** Backend parses this as the string "true" | "false". */
  isActive?: "true" | "false";
  page?: number;
  limit?: number;
}

export interface CreateLeavePolicyPayload {
  name: string;
  code: string;
  branch?: string | null;
  leaveType: LeaveType;
  annualAllocation: number;
  isPaid: boolean;
  allowHalfDay: boolean;
  allowCarryForward: boolean;
  maximumCarryForward?: number | null;
  allowNegativeBalance: boolean;
  minimumNoticeDays: number;
  maximumConsecutiveDays?: number | null;
  applicableFrom: string;
  applicableTo?: string | null;
  isActive: boolean;
}

export type UpdateLeavePolicyPayload = Partial<CreateLeavePolicyPayload>;

// =========================================================================
// Leave balances
// =========================================================================

export interface LeaveBalance {
  _id: string;
  employee: string;
  /** Stored uppercase by the backend. */
  leaveType: string;
  policy: LeavePolicy | string;
  year: number;
  allocated: number;
  used: number;
  pending: number;
  available: number;
  carriedForward: number;
  adjusted: number;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalanceTransaction {
  _id: string;
  employee: string;
  leaveBalance: string;
  leaveRequest?: string;
  leaveType: string;
  transactionType: LeaveBalanceTransactionType;
  source: LeaveBalanceTransactionSource;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  performedBy?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AllocateLeaveBalancePayload {
  employeeId: string;
  leavePolicyId: string;
  year: number;
}

export interface AdjustLeaveBalancePayload {
  /** Read straight off req.body by the controller, not from the zod schema. */
  employeeId: string;
  amount: number;
  remarks: string;
}
