export interface AuditActorRef {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuditBranchRef {
  _id: string;
  name: string;
  code: string;
}

export interface AuditLog {
  _id: string;
  actor: AuditActorRef | null;
  action: string;
  entity: string;
  entityId?: string;
  branch?: AuditBranchRef;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AuditLogListData {
  logs: AuditLog[];
  pagination: AuditLogPagination;
}

export interface AuditLogListResponse {
  success: boolean;
  data: AuditLogListData;
}

export interface AuditLogQueryParams {
  page?: number;
  limit?: number;
  action?: string;
  entity?: string;
  actor?: string;
  entityId?: string;
  branch?: string;
  from?: string;
  to?: string;
  sortOrder?: "asc" | "desc";
}