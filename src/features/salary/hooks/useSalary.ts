import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";

import { salaryApi } from "@/services/salaryApi";
import { getErrorMessage } from "@/utils/getErrorMessage";
import type {
  CreateDeductionPayload,
  Decision,
  DeductionListQuery,
  PayoutInput,
  PayoutListQuery,
  SalarySettingsValues,
} from "@/types/salary";

export const salaryKeys = {
  all: ["salary"] as const,
  settings: () => [...salaryKeys.all, "settings"] as const,
  payouts: (query: PayoutListQuery) =>
    [...salaryKeys.all, "payouts", query] as const,
  payout: (id: string) => [...salaryKeys.all, "payout", id] as const,
  eligible: (from: string, to: string, branchId?: string) =>
    [...salaryKeys.all, "eligible", from, to, branchId] as const,
  preview: (input: PayoutInput | null) =>
    [...salaryKeys.all, "preview", input] as const,
  deductions: (query: DeductionListQuery) =>
    [...salaryKeys.all, "deductions", query] as const,
  mine: (page: number) => [...salaryKeys.all, "mine", page] as const,
  myPayslip: (id: string) => [...salaryKeys.all, "mine", "detail", id] as const,
};

// ---------- Self-service ----------

export const useMyPayouts = (page: number) =>
  useQuery({
    queryKey: salaryKeys.mine(page),
    queryFn: () => salaryApi.listMine({ page }),
    placeholderData: keepPreviousData,
  });

export const useMyPayslip = (id?: string) =>
  useQuery({
    queryKey: salaryKeys.myPayslip(id ?? ""),
    queryFn: () => salaryApi.getMine(id as string),
    enabled: Boolean(id),
  });

// ---------- Settings ----------

export const useSalarySettings = () =>
  useQuery({ queryKey: salaryKeys.settings(), queryFn: salaryApi.getSettings });

export const useUpdateSalarySettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SalarySettingsValues) =>
      salaryApi.updateSettings(payload),
    onSuccess: (response) => {
      toast.success(response.message ?? "Salary rules saved");
      queryClient.setQueryData(salaryKeys.settings(), response.data);
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Failed to save salary rules")),
  });
};

export const useResetSalarySettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: salaryApi.resetSettings,
    onSuccess: (response) => {
      toast.success(response.message ?? "Salary rules reset");
      queryClient.setQueryData(salaryKeys.settings(), response.data);
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Failed to reset salary rules")),
  });
};

// ---------- Payouts ----------

export const usePayouts = (query: PayoutListQuery) =>
  useQuery({
    queryKey: salaryKeys.payouts(query),
    queryFn: () => salaryApi.listPayouts(query),
    placeholderData: keepPreviousData,
  });

export const usePayout = (id?: string) =>
  useQuery({
    queryKey: salaryKeys.payout(id ?? ""),
    queryFn: () => salaryApi.getPayout(id as string),
    enabled: Boolean(id),
  });

export const useEligibleEmployees = (
  from: string,
  to: string,
  branchId?: string,
  enabled = true
) =>
  useQuery({
    queryKey: salaryKeys.eligible(from, to, branchId),
    queryFn: () => salaryApi.eligible({ from, to, branchId }),
    enabled: enabled && Boolean(from && to),
  });

/** A POST, but side-effect free, so it's cached like a query. */
export const usePayoutPreview = (input: PayoutInput | null) =>
  useQuery({
    queryKey: salaryKeys.preview(input),
    queryFn: () => salaryApi.preview(input as PayoutInput),
    enabled: Boolean(input && input.employeeIds.length),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: false,
  });

export const useGeneratePayout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PayoutInput) => salaryApi.generate(input),
    onSuccess: (response) => {
      toast.success(response.message ?? "Payout generated");
      queryClient.invalidateQueries({ queryKey: salaryKeys.all });
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Failed to generate payout")),
  });
};

export const useMarkPayoutPaid = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => salaryApi.markPaid(id),
    onSuccess: (response) => {
      toast.success(response.message ?? "Payout marked as paid");
      queryClient.invalidateQueries({ queryKey: salaryKeys.all });
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Failed to mark payout as paid")),
  });
};

export const useCancelPayout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      salaryApi.cancel(id, reason),
    onSuccess: (response) => {
      toast.success(response.message ?? "Payout cancelled");
      queryClient.invalidateQueries({ queryKey: salaryKeys.all });
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Failed to cancel payout")),
  });
};

// ---------- Deductions ----------

export const useDeductions = (query: DeductionListQuery) =>
  useQuery({
    queryKey: salaryKeys.deductions(query),
    queryFn: () => salaryApi.listDeductions(query),
    placeholderData: keepPreviousData,
  });

export const useCreateDeduction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDeductionPayload) =>
      salaryApi.createDeduction(payload),
    onSuccess: (response) => {
      toast.success(response.message ?? "Deduction recorded");
      queryClient.invalidateQueries({ queryKey: salaryKeys.all });
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Failed to record deduction")),
  });
};

export const useReviewDeduction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      remark,
    }: {
      id: string;
      status: Decision;
      remark?: string;
    }) => salaryApi.reviewDeduction(id, status, remark),
    onSuccess: (response) => {
      toast.success(response.message ?? "Deduction reviewed");
      queryClient.invalidateQueries({ queryKey: salaryKeys.all });
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Failed to review deduction")),
  });
};

export const useDeleteDeduction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => salaryApi.deleteDeduction(id),
    onSuccess: (response) => {
      toast.success(response.message ?? "Deduction deleted");
      queryClient.invalidateQueries({ queryKey: salaryKeys.all });
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Failed to delete deduction")),
  });
};
