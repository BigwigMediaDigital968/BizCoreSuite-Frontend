import type { Pagination } from "@/types/employee";

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedApiEnvelope<T> extends ApiEnvelope<T[]> {
  pagination: Pagination;
}
