// import { useQuery } from "@tanstack/react-query";
// import { reportApi, type DashboardReportFilters } from "@/services/reportApi";

// export const useDashboardReport = (filters: DashboardReportFilters = {}) =>
//   useQuery({
//     queryKey: ["reports-dashboard", filters],
//     queryFn: () => reportApi.getDashboard(filters),
//   });

import { useQuery } from "@tanstack/react-query";
import { reportApi, type DashboardReportFilters } from "@/services/reportApi";

const DEFAULT_FILTERS: DashboardReportFilters = {};

export const useDashboardReport = (
  filters: DashboardReportFilters = DEFAULT_FILTERS,
) =>
  useQuery({
    queryKey: ["reports-dashboard", filters],
    queryFn: () => reportApi.getDashboard(filters),
    staleTime: 5 * 60 * 1000, // Keep cached data fresh for 5 minutes
    refetchOnWindowFocus: false, // Prevent extra hits when switching browser tabs
  });
