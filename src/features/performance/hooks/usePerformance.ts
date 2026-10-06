import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { performanceApi } from "@/services/performanceApi";
import type { PerformanceQuery } from "@/types/performance";

export const performanceKeys = {
  all: ["performance"] as const,
  report: (query: PerformanceQuery) =>
    [...performanceKeys.all, "report", query] as const,
};

export const usePerformanceQuery = (query: PerformanceQuery) =>
  useQuery({
    queryKey: performanceKeys.report(query),
    queryFn: () => performanceApi.getReport(query),
    placeholderData: keepPreviousData,
  });