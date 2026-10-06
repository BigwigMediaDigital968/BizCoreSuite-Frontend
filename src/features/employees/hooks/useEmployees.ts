import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import { employeeApi } from "@/services/employeeApi";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useAuthStore } from "@/store/auth.store";
import { ROLES } from "@/types/auth";
import type {
  CreateEmployeeInput,
  CreateEmployeeProfilePayload,
  Employee,
  EmployeeListQuery,
  EmployeeProfileListQuery,
  UpdateEmployeeInput,
} from "@/types/employee";

// =========================================================================
// User (account) — query keys & hooks
// =========================================================================

export const employeeKeys = {
  all: ["employees"] as const,
  list: (query: EmployeeListQuery) => [...employeeKeys.all, query] as const,
  detail: (id: string) => [...employeeKeys.all, "detail", id] as const,
};

export const useEmployeesQuery = (
  query: EmployeeListQuery = {},
  options?: { enabled?: boolean }
) =>
  useQuery({
    queryKey: employeeKeys.list(query),
    queryFn: () => employeeApi.list(query),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });

export const useEmployeeQuery = (id: string | undefined) =>
  useQuery({
    queryKey: employeeKeys.detail(id ?? ""),
    queryFn: () => employeeApi.getById(id as string),
    enabled: !!id,
  });

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEmployeeInput) => employeeApi.create(payload),
    onSuccess: () => {
      toast.success("Employee onboarded successfully");
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to onboard employee"));
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateEmployeeInput;
    }) => employeeApi.update(id, payload),
    onSuccess: () => {
      toast.success("Employee updated successfully");
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to update employee"));
    },
  });
};

export const useUpdateEmployeeStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      employeeApi.updateStatus(id, isActive),
    onSuccess: (employee) => {
      toast.success(
        employee.isActive
          ? "Employee activated successfully"
          : "Employee deactivated successfully"
      );
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to update employee status"));
    },
  });
};

export const useUpdateEmployeeBranches = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, branches }: { id: string; branches: string[] }) =>
      employeeApi.updateBranches(id, branches),
    onSuccess: () => {
      toast.success("Branch assignment updated successfully");
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to update branch assignment"));
    },
  });
};

/**
 * Headcount per branch, for summary widgets (e.g. the Head dashboard).
 * Fetches one cheap count-only request per branch rather than pulling the
 * full employee list, so it stays fast regardless of workforce size.
 */
export const useEmployeeCountsByBranch = (branchIds: string[]) => {
  const results = useQueries({
    queries: branchIds.map((branchId) => ({
      queryKey: employeeKeys.list({ branchId, limit: 1 }),
      queryFn: () => employeeApi.list({ branchId, limit: 1 }),
      select: (res: Awaited<ReturnType<typeof employeeApi.list>>) =>
        res.pagination.total,
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const counts: Record<string, number> = {};
  branchIds.forEach((id, i) => {
    if (results[i].data !== undefined) counts[id] = results[i].data as number;
  });

  return { counts, isLoading };
};

// =========================================================================
// EmployeeProfile — query keys & hooks
// =========================================================================

export const employeeProfileKeys = {
  all: ["employee-profiles"] as const,
  list: (query: EmployeeProfileListQuery) =>
    [...employeeProfileKeys.all, "list", query] as const,
  detail: (id: string) => [...employeeProfileKeys.all, "detail", id] as const,
  byUser: (userId: string) =>
    [...employeeProfileKeys.all, "by-user", userId] as const,
};

export const useEmployeeProfilesQuery = (
  query: EmployeeProfileListQuery = {},
  options?: { enabled?: boolean }
) =>
  useQuery({
    queryKey: employeeProfileKeys.list(query),
    queryFn: () => employeeApi.listProfiles(query),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });

/**
 * Find the EmployeeProfile that belongs to a given User ID. GET /employee/:id
 * accepts either a profile ID or a user ID (backend does an `$or` lookup), so
 * this is a direct single request.
 *
 * `retry: false` — a 404 here is an expected, valid state (the account
 * exists but has no HR profile yet, e.g. right after onboarding) rather than
 * a transient failure, so it shouldn't be retried. Without this, React
 * Query's default 3 retries with backoff kept the caller's `isLoading` true
 * for several seconds, leaving pages stuck on a loading spinner before
 * falling back to the "not found" state.
 */
export const useEmployeeProfileByUserQuery = (userId: string | undefined) =>
  useQuery({
    queryKey: employeeProfileKeys.byUser(userId ?? ""),
    enabled: !!userId,
    retry: false,
    queryFn: ()=> employeeApi.getProfile(userId as string)
  });

export const useEmployeeProfileQuery = (id: string | undefined) =>
  useQuery({
    queryKey: employeeProfileKeys.detail(id ?? ""),
    queryFn: () => employeeApi.getProfile(id as string),
    enabled: !!id,
    retry: false,
  });

export const useCreateEmployeeProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEmployeeProfilePayload) =>
      employeeApi.createProfile(payload),
    onSuccess: () => {
      toast.success("Employee profile created");
      queryClient.invalidateQueries({ queryKey: employeeProfileKeys.all });
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to create employee profile"));
    },
  });
};

export const useUpdateEmployeeProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: CreateEmployeeProfilePayload;
    }) => employeeApi.updateProfile(id, payload),
    onSuccess: () => {
      toast.success("Employee profile updated");
      queryClient.invalidateQueries({ queryKey: employeeProfileKeys.all });
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to update employee profile"));
    },
  });
};

/**
 * Managers available to be assigned as a reporting manager, scoped to the
 * chosen branch. Returns users with role=manager whose branches include the
 * given branchId.
 */
export const useReportingManagersQuery = (branchId: string | undefined) => {
  const currentUser = useAuthStore((s) => s.user);
  return useQuery({
    enabled: !!branchId,
    queryKey: [
      "users",
      "managers",
      branchId,
      currentUser?.role ?? "anon",
    ],
    queryFn: async (): Promise<Employee[]> => {
      // The user list endpoint already supports `role` and `branchId` filters
      // and respects the actor's access scope — perfect for a manager dropdown.
      const res = await employeeApi.list({
        role: ROLES.MANAGER,
        branchId: branchId,
        limit: 100,
      });
      return res.employees;
    },
  });
};
