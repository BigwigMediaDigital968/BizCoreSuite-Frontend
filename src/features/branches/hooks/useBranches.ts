import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { branchApi } from "@/services/branchApi";
import { getErrorMessage } from "@/utils/getErrorMessage";
import type {
  BranchFormInput,
  UpdateBranchAttendanceConfigInput,
} from "@/types/branch";

export const branchKeys = {
  all: ["branches"] as const,
  attendanceConfig: (id: string) =>
    [...branchKeys.all, id, "attendance-config"] as const,
};

export const useBranchesQuery = () =>
  useQuery({
    queryKey: branchKeys.all,
    queryFn: branchApi.list,
  });

/** Derives a single branch from the cached list — there's no GET /branches/:id
 * endpoint, mirroring the same fallback used for employees. */
export const useBranch = (id: string | undefined) => {
  const query = useBranchesQuery();
  const branch = id ? query.data?.find((b) => b._id === id) : undefined;
  return { ...query, data: branch };
};

export const useCreateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BranchFormInput) => branchApi.create(payload),
    onSuccess: () => {
      toast.success("Branch created successfully");
      queryClient.invalidateQueries({ queryKey: branchKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to create branch"));
    },
  });
};

export const useUpdateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<BranchFormInput>;
    }) => branchApi.update(id, payload),
    onSuccess: () => {
      toast.success("Branch updated successfully");
      queryClient.invalidateQueries({ queryKey: branchKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to update branch"));
    },
  });
};

export const useUpdateBranchStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      branchApi.updateStatus(id, isActive),
    onSuccess: (branch) => {
      toast.success(
        branch.isActive
          ? "Branch activated successfully"
          : "Branch deactivated successfully"
      );
      queryClient.invalidateQueries({ queryKey: branchKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to update branch status"));
    },
  });
};

export const useBranchAttendanceConfig = (id?: string) =>
  useQuery({
    queryKey: branchKeys.attendanceConfig(id ?? ""),
    queryFn: () => branchApi.getAttendanceConfig(id as string),
    enabled: Boolean(id),
  });

export const useUpdateBranchAttendanceConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateBranchAttendanceConfigInput;
    }) => branchApi.updateAttendanceConfig(id, payload),
    onSuccess: (_, variables) => {
      toast.success("Attendance settings updated");
      queryClient.invalidateQueries({
        queryKey: branchKeys.attendanceConfig(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: branchKeys.all });
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error, "Failed to update attendance settings")
      );
    },
  });
};