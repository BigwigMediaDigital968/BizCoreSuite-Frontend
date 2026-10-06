import type { Pagination } from "./global";
import type { BranchRef } from "./branch";

export const LEAD_STATUS = {
  NEW: "new",
  ASSIGNED: "assigned",
  CONTACTED: "contacted",
  FOLLOW_UP: "follow_up",
  INTERESTED: "interested",
  QUALIFIED: "qualified",
  CONVERTED: "converted",
  LOST: "lost",
  CLOSED: "closed",
} as const;

export const LEAD_SOURCE_TYPE = {
  MANUAL: "MANUAL",
  EXCEL: "EXCEL",
  API: "API",
  IMPORT: "IMPORT",
  INTEGRATION: "INTEGRATION",
} as const;

/**
 * Slim user shape the backend populates onto a Lead's `assignedTo` /
 * `createdBy` fields (`.populate(field, "name email role")`).
 */
export interface LeadUserSummary {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export interface Lead {
  _id: string;
  name: string;

  phoneCountryCode: string;

  phone: string;

  email?: string;

  city?: string;

  industry?: string;

  message?: string;

  status: LeadStatus;

  remarks?: string;

  source: string;

  sourceType: LeadSourceType;

  externalId?: string;

  /** Set for leads that came in through an integration (e.g. WATI). */
  integration?: string;

  /** Populated on list/get responses; falls back to a raw id elsewhere. */
  branch: BranchRef | any;

  /** Populated on list/get responses; undefined when unassigned. */
  assignedTo?: LeadUserSummary | any;

  assignedBy?: string;

  assignedAt?: Date;

  /** Populated on list/get responses. */
  createdBy: LeadUserSummary | string;

  isDeleted: boolean;

  createdAt: Date;

  updatedAt: Date;
}

export interface LeadListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  source?: string;
  branchId?: string;
  assignedTo?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: "createdAt" | "updatedAt" | "name" | "status";
  sortOrder?: "asc" | "desc";
}

export interface LeadListResponse {
  leads: Lead[];
  pagination: Pagination;
}


export interface CreateLeadPayload {
  name: string;
  phoneCountryCode: string;
  phone: string;
  email?: string;
  city?: string;
  industry?: string;
  message?: string;
  remarks?: string;
  source: string;
  sourceType: "MANUAL" | "EXCEL" | "API" | "IMPORT";
  branchId?: string;
}

export interface AssignLeadPayload {
  /** At least one of employeeId/branchId is required. */
  employeeId?: string;
  branchId?: string;
}

export interface BulkAssignLeadsPayload extends AssignLeadPayload {
  leadIds: string[];
}

export interface LeadCallLog {
  _id: string;
  lead: string;
  caller?: LeadUserSummary | string;
  branch: string;
  callId?: string;
  fromNumber?: string;
  toNumber?: string;
  callStatus?: string;
  duration?: number;
  recordingUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateLeadStatusPayload {
  status:
  | "new"
  | "assigned"
  | "contacted"
  | "follow_up"
  | "interested"
  | "qualified"
  | "converted"
  | "lost"
  | "closed";
  remark?: string;
}

export interface AddLeadRemarkPayload {
  remark: string;
}

export interface CreateLeadFollowUpPayload {
  scheduledAt: string;
  remark?: string;
}

export interface CompleteLeadFollowUpPayload {
  remark: string;
}

/** Slim lead shape the backend populates onto a follow-up's `lead` field
 * (`.populate("lead", "name phone email city status")`). */
export interface LeadFollowUpLeadSummary {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  status: LeadStatus;
}

export interface LeadFollowUp {
  _id: string;
  lead: string | LeadFollowUpLeadSummary;
  assignedTo: string | LeadUserSummary;
  createdBy: string;
  branch: string;
  scheduledAt: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED" | "MISSED";
  remark?: string;
  completedAt?: string | null;
  completedBy?: string | LeadUserSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadActivity {
  _id: string;
  lead: string;
  activityType:
  | "created"
  | "assigned"
  | "status_changed"
  | "remark_added"
  | "follow_up"
  | "call_logged"
  | "whatsapp_in"
  | "whatsapp_out";
  performedBy: LeadUserSummary;
  previousStatus?: string;
  newStatus?: string;
  remark?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type LeadStatus = (typeof LEAD_STATUS)[keyof typeof LEAD_STATUS];
export type LeadSourceType = (typeof LEAD_SOURCE_TYPE)[keyof typeof LEAD_SOURCE_TYPE];
