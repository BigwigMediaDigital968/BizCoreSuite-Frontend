import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";

import { dailyReportApi } from "@/services/dailyReportApi";
import { getErrorMessage } from "@/utils/getErrorMessage";
import type {
  DailyReportListQuery,
  SubmitDailyReportPayload,
} from "@/types/dailyReport";

export const dailyReportKeys = {
  all: ["daily-reports"] as const,
  window: () => [...dailyReportKeys.all, "window"] as const,
  mine: (page: number) => [...dailyReportKeys.all, "mine", page] as const,
  list: (query: DailyReportListQuery) =>
    [...dailyReportKeys.all, "list", query] as const,
  detail: (id: string) => [...dailyReportKeys.all, "detail", id] as const,
  missing: (date: string, branchId?: string) =>
    [...dailyReportKeys.all, "missing", date, branchId] as const,
  summary: (startDate: string, endDate: string, branchId?: string) =>
    [...dailyReportKeys.all, "summary", startDate, endDate, branchId] as const,
};

/** Polled so the page flips to "open" on its own when the window starts. */
export const useReportWindow = (enabled = true) =>
  useQuery({
    queryKey: dailyReportKeys.window(),
    queryFn: dailyReportApi.getWindow,
    enabled,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

export const useMyDailyReports = (page: number, limit = 10) =>
  useQuery({
    queryKey: dailyReportKeys.mine(page),
    queryFn: () => dailyReportApi.listMine({ page, limit }),
    placeholderData: keepPreviousData,
  });

export const useSubmitDailyReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitDailyReportPayload) =>
      dailyReportApi.submit(payload),
    onSuccess: (response) => {
      toast.success(response.message ?? "Daily report saved");
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to submit daily report"));
      // The window may have closed underneath the form.
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.window() });
    },
  });
};

export const useDailyReports = (query: DailyReportListQuery) =>
  useQuery({
    queryKey: dailyReportKeys.list(query),
    queryFn: () => dailyReportApi.list(query),
    placeholderData: keepPreviousData,
  });

export const useMissingDailyReports = (date: string, branchId?: string) =>
  useQuery({
    queryKey: dailyReportKeys.missing(date, branchId),
    queryFn: () => dailyReportApi.missing({ date, branchId }),
    enabled: Boolean(date),
  });

export const useDailyReportSummary = (
  startDate: string,
  endDate: string,
  branchId?: string
) =>
  useQuery({
    queryKey: dailyReportKeys.summary(startDate, endDate, branchId),
    queryFn: () => dailyReportApi.summary({ startDate, endDate, branchId }),
    enabled: Boolean(startDate && endDate),
  });

export const useReviewDailyReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, remark }: { id: string; remark?: string }) =>
      dailyReportApi.review(id, remark),
    onSuccess: () => {
      toast.success("Report marked as reviewed");
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to review report"));
    },
  });
};
