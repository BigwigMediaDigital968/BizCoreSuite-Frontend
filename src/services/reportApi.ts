import { apiClient } from "./apiClient";
import type { ApiEnvelope } from "./apiEnvelope";

export interface DashboardReportFilters {
  startDate?: string;
  endDate?: string;
  branchId?: string;
  employeeId?: string;
}

export interface LeadStatusBreakdown {
  status: string;
  count: number;
}

export interface DashboardLeadsSummary {
  totalLeads: number;
  statusBreakdown: LeadStatusBreakdown[];
}

export interface RevenueSummary {
  today: number;
  total: number;
}

export interface TopPerformer {
  name: string;
  code?: string;
  branchName?: string;
  managedBranch?: string;
  revenue: number;
}

export interface TopPerformersSummary {
  branch?: TopPerformer;
  employee?: TopPerformer;
  admin?: TopPerformer;
}

export interface DashboardSummary {
  leads: DashboardLeadsSummary;
  revenue?: RevenueSummary;
  topPerformers?: TopPerformersSummary;
  attendance: unknown[];
  calls: unknown[];
  leaves: unknown[];
}

export const REPORT_MODULES = {
  ALL: "ALL",
  LEAD: "LEAD",
  ATTENDANCE: "ATTENDANCE",
  CALL_LOG: "CALL_LOG",
  REVENUE: "REVENUE",
  LEAVE: "LEAVE",
} as const;

export type ReportModule = (typeof REPORT_MODULES)[keyof typeof REPORT_MODULES];

export const REPORT_MODULE_LABELS: Record<ReportModule, string> = {
  ALL: "Dashboard Summary",
  LEAD: "Leads",
  ATTENDANCE: "Attendance",
  CALL_LOG: "Call Logs",
  REVENUE: "Revenue",
  LEAVE: "Leave",
};

export type ReportFormat = "csv" | "excel";

export interface ExportReportFilters extends DashboardReportFilters {
  module?: ReportModule;
  format?: ReportFormat;
}

export interface ExportedReport {
  blob: Blob;
  filename: string;
}

const FORMAT_EXTENSIONS: Record<ReportFormat, string> = {
  csv: "csv",
  excel: "xlsx",
};

const filenameFromDisposition = (disposition?: string) =>
  disposition?.match(/filename=([^;]+)/i)?.[1]?.trim().replace(/"/g, "");

export const reportApi = {
  getDashboard: async (
    filters: DashboardReportFilters = {}
  ): Promise<DashboardSummary> => {
    const { data } = await apiClient.get<ApiEnvelope<DashboardSummary>>(
      "/reports/dashboard",
      { params: filters }
    );
    return data.data;
  },

  exportReport: async (
    filters: ExportReportFilters = {}
  ): Promise<ExportedReport> => {
    const module = filters.module ?? "ALL";
    const format = filters.format ?? "csv";

    const response = await apiClient.get<Blob>("/reports/export", {
      params: { ...filters, module, format },
      responseType: "blob",
    });

    return {
      blob: response.data,
      filename:
        filenameFromDisposition(response.headers["content-disposition"]) ??
        `report-${module}-${Date.now()}.${FORMAT_EXTENSIONS[format]}`,
    };
  },
};