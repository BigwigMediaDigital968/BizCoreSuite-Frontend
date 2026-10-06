import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";

import { leaveApi } from "@/services/leaveApi";
import { getErrorMessage } from "@/utils/getErrorMessage";
import type {
  AdjustLeaveBalancePayload,
  AllocateLeaveBalancePayload,
  CreateLeavePolicyPayload,
  CreateLeaveRequestPayload,
  LeavePolicyListQuery,
  LeaveRequestListQuery,
  UpdateLeavePolicyPayload,
  UpdateLeaveRequestPayload,
} from "@/types/leave";

export const leaveKeys = {
  all: ["leaves"] as const,
  list: (query: LeaveRequestListQuery) =>
    [...leaveKeys.all, "list", query] as const,
  detail: (id: string) => [...leaveKeys.all, "detail", id] as const,
};

export const leavePolicyKeys = {
  all: ["leave-policies"] as const,
  list: (query: LeavePolicyListQuery) =>
    [...leavePolicyKeys.all, "list", query] as const,
  detail: (id: string) => [...leavePolicyKeys.all, "detail", id] as const,
};

export const leaveBalanceKeys = {
  all: ["leave-balances"] as const,
  mine: (year?: number) => [...leaveBalanceKeys.all, "mine", year] as const,
  employee: (employeeId: string, year?: number) =>
    [...leaveBalanceKeys.all, "employee", employeeId, year] as const,
  transactions: (employeeId: string, leaveBalanceId?: string) =>
    [...leaveBalanceKeys.all, "transactions", employeeId, leaveBalanceId] as const,
};

/** Balances move whenever a request changes state, so refresh both together. */
const useLeaveInvalidator = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: leaveKeys.all });
    queryClient.invalidateQueries({ queryKey: leaveBalanceKeys.all });
  };
};

// =========================================================================
// Leave requests
// =========================================================================

export const useLeaveRequests = (query: LeaveRequestListQuery = {}) =>
  useQuery({
    queryKey: leaveKeys.list(query),
    queryFn: () => leaveApi.list(query),
    placeholderData: keepPreviousData,
  });

export const useLeaveRequest = (id: string | undefined) =>
  useQuery({
    queryKey: leaveKeys.detail(id ?? ""),
    queryFn: () => leaveApi.getById(id as string),
    enabled: !!id,
  });

export const useCreateLeaveRequest = () => {
  const invalidate = useLeaveInvalidator();

  return useMutation({
    mutationFn: (payload: CreateLeaveRequestPayload) => leaveApi.create(payload),
    onSuccess: () => {
      toast.success("Leave request submitted");
      invalidate();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to submit leave request"));
    },
  });
};

export const useUpdateLeaveRequest = () => {
  const invalidate = useLeaveInvalidator();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateLeaveRequestPayload;
    }) => leaveApi.update(id, payload),
    onSuccess: () => {
      toast.success("Leave request updated");
      invalidate();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to update leave request"));
    },
  });
};

export const useCancelLeaveRequest = () => {
  const invalidate = useLeaveInvalidator();

  return useMutation({
    mutationFn: (id: string) => leaveApi.cancel(id),
    onSuccess: () => {
      toast.success("Leave request cancelled");
      invalidate();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to cancel leave request"));
    },
  });
};

export const useApproveLeaveRequest = () => {
  const invalidate = useLeaveInvalidator();

  return useMutation({
    mutationFn: (id: string) => leaveApi.approve(id),
    onSuccess: () => {
      toast.success("Leave request approved");
      invalidate();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to approve leave request"));
    },
  });
};

export const useRejectLeaveRequest = () => {
  const invalidate = useLeaveInvalidator();

  return useMutation({
    mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason: string }) =>
      leaveApi.reject(id, { rejectionReason }),
    onSuccess: () => {
      toast.success("Leave request rejected");
      invalidate();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to reject leave request"));
    },
  });
};

// =========================================================================
// Leave policies
// =========================================================================

export const useLeavePolicies = (query: LeavePolicyListQuery = {}) =>
  useQuery({
    queryKey: leavePolicyKeys.list(query),
    queryFn: () => leaveApi.listPolicies(query),
    placeholderData: keepPreviousData,
  });

export const useCreateLeavePolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateLeavePolicyPayload) =>
      leaveApi.createPolicy(payload),
    onSuccess: () => {
      toast.success("Leave policy created");
      queryClient.invalidateQueries({ queryKey: leavePolicyKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to create leave policy"));
    },
  });
};

export const useUpdateLeavePolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateLeavePolicyPayload;
    }) => leaveApi.updatePolicy(id, payload),
    onSuccess: () => {
      toast.success("Leave policy updated");
      queryClient.invalidateQueries({ queryKey: leavePolicyKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to update leave policy"));
    },
  });
};

export const useDeactivateLeavePolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => leaveApi.deactivatePolicy(id),
    onSuccess: () => {
      toast.success("Leave policy deactivated");
      queryClient.invalidateQueries({ queryKey: leavePolicyKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to deactivate leave policy"));
    },
  });
};

// =========================================================================
// Leave balances
// =========================================================================

export const useMyLeaveBalances = (year?: number) =>
  useQuery({
    queryKey: leaveBalanceKeys.mine(year),
    queryFn: () => leaveApi.myBalances(year),
  });

export const useEmployeeLeaveBalances = (
  employeeId: string | undefined,
  year?: number
) =>
  useQuery({
    queryKey: leaveBalanceKeys.employee(employeeId ?? "", year),
    queryFn: () => leaveApi.employeeBalances(employeeId as string, year),
    enabled: !!employeeId,
  });

export const useLeaveBalanceTransactions = (
  employeeId: string | undefined,
  leaveBalanceId?: string
) =>
  useQuery({
    queryKey: leaveBalanceKeys.transactions(employeeId ?? "", leaveBalanceId),
    queryFn: () =>
      leaveApi.balanceTransactions(employeeId as string, leaveBalanceId),
    enabled: !!employeeId,
  });

export const useAllocateLeaveBalance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AllocateLeaveBalancePayload) =>
      leaveApi.allocateBalance(payload),
    onSuccess: () => {
      toast.success("Leave balance allocated");
      queryClient.invalidateQueries({ queryKey: leaveBalanceKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to allocate leave balance"));
    },
  });
};

export const useAdjustLeaveBalance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      leaveBalanceId,
      payload,
    }: {
      leaveBalanceId: string;
      payload: AdjustLeaveBalancePayload;
    }) => leaveApi.adjustBalance(leaveBalanceId, payload),
    onSuccess: () => {
      toast.success("Leave balance adjusted");
      queryClient.invalidateQueries({ queryKey: leaveBalanceKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to adjust leave balance"));
    },
  });
};
