import { useState } from "react";
import { Link, useNavigate } from "react-router";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useBranchesQuery } from "@/features/branches";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useAuthStore } from "@/store/auth.store";
import { ROLE_LABELS, ROLES, getAssignableRoles, type Role } from "@/types/auth";
import type { Employee } from "@/types/employee";
import AssignBranchesModal from "../components/AssignBranchesModal";
import EmployeeFormModal from "../components/EmployeeFormModal";
import { employeeKeys, useEmployeesQuery, useUpdateEmployeeStatus } from "../hooks/useEmployees";
import RefreshButton from "@/components/ui/RefreshButton";
import { Can } from "@/components/Auth/Can";

const PAGE_SIZE = 10;

const ROLE_FILTER_OPTIONS: { label: string; value: Role | "" }[] = [
  { label: "All Roles", value: "" },
  { label: "Head", value: ROLES.HEAD },
  { label: "Administrator", value: ROLES.ADMIN },
  { label: "Manager", value: ROLES.MANAGER },
  { label: "Employee", value: ROLES.EMPLOYEE },
];

const STATUS_FILTER_OPTIONS = [
  { label: "All Statuses", value: "" },
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
] as const;

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const EmployeeListPage = () => {
  const currentUser = useAuthStore((s) => s.user);
  const isManager = currentUser?.role === ROLES.MANAGER;
  const assignableRoles = currentUser ? getAssignableRoles(currentUser.role) : [];

  // Manager: the Role filter only offers roles they actually manage
  // (reuses the same assignableRoles list already computed above for the
  // create/edit modal) — "All Team" still fetches everyone in their
  // branch, but peer Manager rows are hidden client-side below.
  const roleFilterOptions: { label: string; value: Role | "" }[] = isManager
    ? [
        { label: "All Team", value: "" },
        ...assignableRoles.map((role) => ({ label: ROLE_LABELS[role], value: role })),
      ]
    : ROLE_FILTER_OPTIONS;

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [branchFilter, setBranchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTER_OPTIONS)[number]["value"]>("");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  // Jump back to page 1 whenever the result set changes shape. Adjusting
  // state during render (rather than in an effect) avoids an extra
  // render-then-fetch-then-render cascade — see "You Might Not Need an Effect".
  const filtersKey = `${debouncedSearch}|${roleFilter}|${branchFilter}|${statusFilter}`;
  const [trackedFiltersKey, setTrackedFiltersKey] = useState(filtersKey);
  if (filtersKey !== trackedFiltersKey) {
    setTrackedFiltersKey(filtersKey);
    setPage(1);
  }

  const { data: branches } = useBranchesQuery();

  const { data, isLoading, isFetching, isError, error } = useEmployeesQuery({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    role: roleFilter || undefined,
    // Manager: always their own branch, never a company-wide pick.
    branchId: isManager ? currentUser?.branches?.[0] : branchFilter || undefined,
    isActive: statusFilter === "" ? undefined : statusFilter === "true",
  });

  const isForbidden =
    isError &&
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    (error as { response?: { status?: number } }).response?.status === 403;

  // A peer Manager should never show up in another Manager's directory —
  // only the branch-scoped fetch above is shared with them, so filter that
  // one role out client-side (their own row stays visible).
  const employees = (data?.employees ?? []).filter(
    (emp) => !(isManager && emp.role === ROLES.MANAGER && emp._id !== currentUser?._id)
  );
  const pagination = data?.pagination;

  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [branchTarget, setBranchTarget] = useState<Employee | null>(null);
  const [statusTarget, setStatusTarget] = useState<Employee | null>(null);

  const updateStatus = useUpdateEmployeeStatus();

  const handleConfirmStatusChange = async () => {
    if (!statusTarget) return;
    await updateStatus.mutateAsync({
      id: statusTarget._id,
      isActive: !statusTarget.isActive,
    });
    setStatusTarget(null);
  };

  // Mutating actions (branch assignment, edit, status toggle) are
  // hierarchy-gated the same way as viewing: only roles junior to yours
  // (assignableRoles) can be touched — a peer or senior account (even
  // another Admin, if you're an Admin) is locked — plus your own row is
  // always locked, since you shouldn't reassign/deactivate yourself here.
  const isRowLocked = (emp: Employee) =>
    emp._id === currentUser?._id || !assignableRoles.includes(emp.role);

  // Viewing is read-only, but still hierarchy-gated: a role can only view
  // profiles junior to its own (the same set it's allowed to assign —
  // ROLE_HIERARCHY via getAssignableRoles/assignableRoles above). Peers and
  // seniors are locked, even in the same branch — the table row already
  // shows their name/email, and a peer's full profile isn't yours to open.
  // Your own row is always viewable regardless.
  const isViewLocked = (emp: Employee) =>
    emp._id !== currentUser?._id && !assignableRoles.includes(emp.role);

  return (
    <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs tracking-wider uppercase mb-1">
            <span className="h-0.5 w-4 bg-primary rounded-full" />
            <span>Human Resources</span>
          </div>
          <h1 className="font-headline-md text-2xl sm:text-3xl font-extrabold text-on-surface">
            Organization Directory
          </h1>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1 max-w-2xl">
            Manage your workforce, update roles, and control branch access
            across the organization.          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <RefreshButton queryKey={employeeKeys.all} />

          <Can permission={'user:create'}>
            <Link
              to={'/employees/onboard'}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-label-md text-xs font-bold text-on-primary shadow-sm hover:bg-primary/90 transition-all shrink-0"
            >
              <span className="material-symbols-outlined text-xl">person_add</span>
              <span>Onboard Employee</span>
            </Link>
          </Can>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1 min-w-60 items-center rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3.5 py-2.5 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-xl text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-transparent pl-8 font-body-md text-on-surface outline-none placeholder:text-on-surface-variant/60"
          />
        </div>

        <div className="relative">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as Role | "")}
            className="w-full appearance-none rounded-xl border border-outline-variant/50 bg-surface-container-low px-4 py-2.5 pr-10 font-label-md text-on-surface outline-none focus:border-primary transition-all"
          >
            {roleFilterOptions.map((opt) => (
              <option key={opt.label} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xl text-on-surface-variant">
            expand_more
          </span>
        </div>

        {/* Branch filter — Head/Admin only. A Manager's directory is
            already their own branch, so there's nothing to pick. */}
        {!isManager && (
          <div className="relative">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-outline-variant/50 bg-surface-container-low px-4 py-2.5 pr-10 font-label-md text-on-surface outline-none focus:border-primary transition-all"
            >
              <option value="">All Branches</option>
              {branches?.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xl text-on-surface-variant">
              expand_more
            </span>
          </div>
        )}

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as (typeof STATUS_FILTER_OPTIONS)[number]["value"])
            }
            className="w-full appearance-none rounded-xl border border-outline-variant/50 bg-surface-container-low px-4 py-2.5 pr-10 font-label-md text-on-surface outline-none focus:border-primary transition-all"
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xl text-on-surface-variant">
            expand_more
          </span>
        </div>

        {pagination && (
          <p className="font-body-sm text-xs text-on-surface-variant lg:ml-auto shrink-0">
            <span className="font-bold text-on-surface">{pagination.total}</span>{" "}
            employees found
          </p>
        )}
      </div>

      {/* Directory Table Card */}
      <div className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-lowest shadow-sm">
        {isForbidden ? (
          <div className="px-6 py-16 text-center">
            <span className="material-symbols-outlined text-4xl mb-2 text-outline">
              lock
            </span>
            <p className="font-body-md text-on-surface-variant">
              You don't have permission to view the employee directory.
            </p>
          </div>
        ) : isError ? (
          <div className="px-6 py-16 text-center">
            <span className="material-symbols-outlined text-4xl mb-2 text-error">
              error
            </span>
            <p className="font-body-md text-error">
              Failed to load employees. Please try again.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-container-low/50">
                  <th className="px-6 py-4 font-label-md text-[11px] uppercase tracking-wider text-on-surface-variant/80">
                    Profile
                  </th>
                  <th className="px-6 py-4 font-label-md text-[11px] uppercase tracking-wider text-on-surface-variant/80">
                    Role
                  </th>
                  <th className="px-6 py-4 font-label-md text-[11px] uppercase tracking-wider text-on-surface-variant/80">
                    Branches
                  </th>
                  <th className="px-6 py-4 font-label-md text-[11px] uppercase tracking-wider text-on-surface-variant/80">
                    Status
                  </th>
                  <th className="px-6 py-4 font-label-md text-[11px] uppercase tracking-wider text-on-surface-variant/80">
                    Joined
                  </th>
                  <th className="px-6 py-4 font-label-md text-[11px] uppercase tracking-wider text-on-surface-variant/80 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-6 py-4">
                        <div className="h-9 rounded-lg bg-surface-container-high animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-4xl mb-2 text-outline block">
                        search_off
                      </span>
                      <p className="font-body-md">
                        No employees found matching your filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => {
                    const locked = isRowLocked(emp);
                    const viewLocked = isViewLocked(emp);
                    return (
                      <tr
                        key={emp._id}
                        className="hover:bg-surface-container-low/40 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-label-md text-xs font-bold text-primary">
                              {getInitials(emp.name)}
                            </div>
                            <div>
                              <p className="font-label-md text-on-surface">{emp.name}</p>
                              <p className="font-body-sm text-xs text-on-surface-variant/80">
                                {emp.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-block rounded-full bg-primary/10 px-2.5 py-1 font-label-sm text-[11px] font-semibold text-primary">
                            {ROLE_LABELS[emp.role]}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          {emp.branches.length === 0 ? (
                            <span className="font-body-sm text-xs text-on-surface-variant/50 italic">
                              Unassigned
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5 max-w-55">
                              {emp.branches.slice(0, 2).map((b) => (
                                <span
                                  key={b._id}
                                  className="inline-block rounded-md bg-surface-container-high px-2 py-0.5 font-label-sm text-[10px] font-semibold text-on-surface-variant"
                                >
                                  {b.code}
                                </span>
                              ))}
                              {emp.branches.length > 2 && (
                                <span className="inline-block rounded-md bg-surface-container-high px-2 py-0.5 font-label-sm text-[10px] font-semibold text-on-surface-variant">
                                  +{emp.branches.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-label-sm text-[11px] font-semibold ${emp.isActive
                              ? "bg-emerald-500/10 text-emerald-700"
                              : "bg-surface-container-high text-on-surface-variant"
                              }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${emp.isActive ? "bg-emerald-500" : "bg-outline"
                                }`}
                            />
                            {emp.isActive ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>

                        <td className="px-6 py-4 font-body-sm text-xs text-on-surface-variant">
                          {formatDate(emp.createdAt)}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Can permission={'user:assign-branch'}>

                              <button
                                onClick={() => setBranchTarget(emp)}
                                disabled={locked}
                                title={locked ? "This account cannot be reassigned" : "Assign branches"}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                              >
                                <span className="material-symbols-outlined text-lg">
                                  domain
                                </span>
                              </button>
                            </Can>

                            <Can permission={'user:view'}>
                              <button
                              // onClick={() => setViewTarget(emp)}
                              onClick={() => (navigate(`/employees/${emp._id}/profile`))}
                              disabled={viewLocked}
                              title={viewLocked ? "This account cannn't be viewd" : "View employee"}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            >

                              <span className="material-symbols-outlined text-lg">
                                visibility
                              </span>
                            </button>
                            </Can>
                            <Can permission={'user:update'}>
                              <button
                                onClick={() => (navigate(`/employees/${emp._id}/edit`))}
                                disabled={locked}
                                title={locked ? "This account cannot be edited here" : "Edit employee"}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                              >
                                <span className="material-symbols-outlined text-lg">
                                  edit
                                </span>
                              </button>
                            </Can>
                            <Can permission={'user:status:update'}>
                              <button
                                onClick={() => setStatusTarget(emp)}
                                disabled={locked}
                                title={
                                  locked
                                    ? "Status cannot be changed here"
                                    : emp.isActive
                                      ? "Deactivate employee"
                                      : "Activate employee"
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                              >
                                <span className="material-symbols-outlined text-lg">
                                  {emp.isActive ? "block" : "check_circle"}
                                </span>
                              </button>
                            </Can>

                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-outline-variant/30 px-6 py-4 bg-surface-container-lowest">
            <p className="font-body-sm text-xs text-on-surface-variant">
              Page <span className="font-medium text-on-surface">{pagination.page}</span> of{" "}
              <span className="font-medium text-on-surface">{pagination.totalPages}</span>
              {isFetching && " · refreshing…"}
            </p>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={pagination.page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container disabled:opacity-40 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
                disabled={pagination.page >= pagination.totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container disabled:opacity-40 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <EmployeeFormModal
        key={editTarget?._id ?? "employee-form-closed"}
        open={Boolean(editTarget)}
        employee={editTarget}
        assignableRoles={assignableRoles}
        onClose={() => setEditTarget(null)}
      />

      <AssignBranchesModal
        key={branchTarget?._id ?? "assign-branches-closed"}
        open={Boolean(branchTarget)}
        employee={branchTarget}
        onClose={() => setBranchTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleConfirmStatusChange}
        isLoading={updateStatus.isPending}
        tone={statusTarget?.isActive ? "danger" : "primary"}
        title={statusTarget?.isActive ? "Deactivate Employee?" : "Activate Employee?"}
        description={
          statusTarget?.isActive
            ? `${statusTarget?.name} will lose access to the CRM immediately.`
            : `${statusTarget?.name} will regain access to the CRM.`
        }
        confirmLabel={statusTarget?.isActive ? "Deactivate" : "Activate"}
      />
    </div>
  );
};

export default EmployeeListPage;
