import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { holidayApi } from "@/services/holidayApi";
import { getErrorMessage } from "@/utils/getErrorMessage";
import type { CreateHolidayInput, UpdateHolidayInput } from "@/types/holiday";

export const holidayKeys = {
  all: ["holidays"] as const,
  branch: (branchId: string, year?: number) =>
    [...holidayKeys.all, "branch", branchId, { year }] as const,
};

/** Fetches holidays for a specific branch, optionally filtered by year */
export const useBranchHolidaysQuery = (branchId?: string, year?: number) =>
  useQuery({
    queryKey: holidayKeys.branch(branchId ?? "", year),
    queryFn: () => holidayApi.getByBranch(branchId as string, year),
    enabled: Boolean(branchId),
  });

export const useCreateHoliday = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateHolidayInput) => holidayApi.create(payload),
    onSuccess: (_, variables) => {
      toast.success("Holiday created successfully");
      queryClient.invalidateQueries({
        queryKey: holidayKeys.branch(variables.branchId),
      });
      queryClient.invalidateQueries({ queryKey: holidayKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to create holiday"));
    },
  });
};

export const useUpdateHoliday = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateHolidayInput;
    }) => holidayApi.update(id, payload),
    onSuccess: () => {
      toast.success("Holiday updated successfully");
      queryClient.invalidateQueries({ queryKey: holidayKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to update holiday"));
    },
  });
};

export const useDeleteHoliday = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => holidayApi.delete(id),
    onSuccess: () => {
      toast.success("Holiday deleted successfully");
      queryClient.invalidateQueries({ queryKey: holidayKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to delete holiday"));
    },
  });
};