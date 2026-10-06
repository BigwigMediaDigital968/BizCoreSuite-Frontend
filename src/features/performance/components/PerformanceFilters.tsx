import React from "react";
import type { Branch } from "@/types/branch";
import type { Employee } from "@/types/employee";
import type { PerformanceQuery, PerformanceViewMode } from "@/types/performance";

interface PerformanceFiltersProps {
  filters: PerformanceQuery;
  onChange: (next: PerformanceQuery) => void;
  onReset: () => void;

  branches?: Branch[];
  branchesLoading?: boolean;

  employees?: Employee[];
  employeesLoading?: boolean;

  userRole?: string;
  /** Needed to highlight/drive the Manager's "My Performance" toggle. */
  currentUserId?: string;
  /**
   * ADMIN only — branch ids the admin is assigned to (req.user.branches).
   * Restricts the Branch dropdown so an admin can never even attempt an
   * unassigned branch. ASSUMPTION: sourced from `user.branches` in the
   * auth store — flag if the field is named differently.
   */
  assignedBranchIds?: string[];
}

const selectClass =
  "w-full appearance-none rounded-xl border border-outline-variant/50 bg-surface-container-low px-3.5 py-2.5 pr-9 font-label-md text-xs font-semibold text-on-surface outline-none focus:border-primary transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

const dateClass =
  "w-full rounded-xl border border-outline-variant/50 bg-surface-container-low px-3.5 py-2.5 font-label-md text-xs font-semibold text-on-surface outline-none focus:border-primary transition-all cursor-pointer";

const SelectWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="relative">
    {children}
    <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-lg text-on-surface-variant">
      expand_more
    </span>
  </div>
);

const DateRangeFields = ({
  filters,
  set,
}: {
  filters: PerformanceQuery;
  set: (patch: Partial<PerformanceQuery>) => void;
}) => (
  <div className="flex items-end gap-2">
    <div className="space-y-1">
      <label className="block font-label-sm text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
        From
      </label>
      <input
        type="date"
        value={filters.startDate?.slice(0, 10) ?? ""}
        max={filters.endDate?.slice(0, 10)}
        onChange={(e) =>
          set({
            startDate: e.target.value ? `${e.target.value}T00:00:00.000Z` : undefined,
          })
        }
        className={dateClass}
      />
    </div>

    <div className="space-y-1">
      <label className="block font-label-sm text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
        To
      </label>
      <input
        type="date"
        value={filters.endDate?.slice(0, 10) ?? ""}
        min={filters.startDate?.slice(0, 10)}
        onChange={(e) =>
          set({
            endDate: e.target.value ? `${e.target.value}T23:59:59.999Z` : undefined,
          })
        }
        className={dateClass}
      />
    </div>
  </div>
);

const PerformanceFilters = ({
  filters,
  onChange,
  onReset,
  branches,
  branchesLoading,
  employees,
  employeesLoading,
  userRole,
  currentUserId,
  assignedBranchIds,
}: PerformanceFiltersProps) => {
  const role = userRole?.toLowerCase();

  const isHead = role === "head";
  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const isEmployee = role === "employee";

  const isManagement = isHead || isAdmin;

  const set = (patch: Partial<PerformanceQuery>) => {
    onChange({ ...filters, ...patch });
  };

  // ---------------------------------------------------------------
  // EMPLOYEE: date range only. No viewMode/target — always own INDIVIDUAL.
  // ---------------------------------------------------------------
  if (isEmployee) {
    return (
      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm">
        <DateRangeFields filters={filters} set={set} />
      </div>
    );
  }

  // Admin only ever sees branches they're assigned to.
  const visibleBranches =
    isAdmin && assignedBranchIds?.length
      ? branches?.filter((b) => assignedBranchIds.includes(b._id))
      : branches;

  const selectedManagerId =
    isManagement && filters.viewMode === "TEAM" ? filters.targetUserId : "";

  const selectedEmployeeId =
    (isManagement && filters.viewMode === "INDIVIDUAL") || isManager
      ? filters.targetUserId
      : "";

  const isViewingSelf =
    isManager && filters.viewMode === "INDIVIDUAL" && filters.targetUserId === currentUserId;
  const isViewingTeam = isManager && filters.viewMode === "TEAM" && !filters.targetUserId;

  const hasActiveFilters = Boolean(
    filters.branchId || filters.targetUserId || filters.viewMode
  );

  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        <DateRangeFields filters={filters} set={set} />

        {/* =========================
            HEAD / ADMIN — View Mode
            No selection = global (Head: everything, Admin: their
            assigned branches, scoped server-side).
        ========================= */}
        {isManagement && (
          <div className="space-y-1 min-w-[160px]">
            <label className="block font-label-sm text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
              View Mode
            </label>

            <SelectWrapper>
              <select
                value={filters.viewMode ?? ""}
                onChange={(e) => {
                  const nextMode = e.target.value as PerformanceViewMode | "";
                  set({
                    viewMode: nextMode,
                    targetUserId: undefined,
                    branchId: nextMode === "BRANCH" ? filters.branchId : undefined,
                  });
                }}
                className={selectClass}
              >
                <option value="">
                  {isHead ? "Global (All Branches)" : "Global (My Branches)"}
                </option>
                <option value="BRANCH">Branch</option>
                <option value="TEAM">Team</option>
                <option value="INDIVIDUAL">Individual</option>
              </select>
            </SelectWrapper>
          </div>
        )}

        {/* HEAD / ADMIN — Branch */}
        {isManagement && filters.viewMode === "BRANCH" && (
          <div className="space-y-1 min-w-[190px]">
            <label className="block font-label-sm text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
              Branch
            </label>

            <SelectWrapper>
              <select
                value={filters.branchId ?? ""}
                disabled={branchesLoading}
                onChange={(e) => set({ branchId: e.target.value || undefined })}
                className={selectClass}
              >
                <option value="">Select a branch…</option>
                {visibleBranches?.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name} ({branch.code})
                  </option>
                ))}
              </select>
            </SelectWrapper>
          </div>
        )}

        {/* HEAD / ADMIN — Team (pick a manager) */}
        {isManagement && filters.viewMode === "TEAM" && (
          <div className="space-y-1 min-w-[190px]">
            <label className="block font-label-sm text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
              Manager
            </label>

            <SelectWrapper>
              <select
                value={selectedManagerId ?? ""}
                disabled={employeesLoading}
                onChange={(e) => set({ targetUserId: e.target.value || undefined })}
                className={selectClass}
              >
                <option value="">Select a manager…</option>
                {employees
                  ?.filter((e) => e.role === "manager")
                  .map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.name}
                    </option>
                  ))}
              </select>
            </SelectWrapper>
          </div>
        )}

        {/* HEAD / ADMIN — Individual (pick any employee) */}
        {isManagement && filters.viewMode === "INDIVIDUAL" && (
          <div className="space-y-1 min-w-[190px]">
            <label className="block font-label-sm text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
              Employee
            </label>

            <SelectWrapper>
              <select
                value={selectedEmployeeId ?? ""}
                disabled={employeesLoading}
                onChange={(e) => set({ targetUserId: e.target.value || undefined })}
                className={selectClass}
              >
                <option value="">Select an employee…</option>
                {employees
                  ?.filter((e) => e.role === "employee")
                  .map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.name}
                    </option>
                  ))}
              </select>
            </SelectWrapper>
          </div>
        )}

        {/* =========================
            MANAGER — My Team / My Performance + drill-down
            No Branch, no View Mode dropdown: backend 403s both.
        ========================= */}
        {isManager && (
          <>
            <div className="flex items-center gap-1 rounded-xl bg-surface-container-low p-1 w-fit">
              <button
                type="button"
                onClick={() => set({ targetUserId: undefined, viewMode: "TEAM" })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isViewingTeam ? "bg-primary text-on-primary" : "text-on-surface-variant"
                }`}
              >
                My Team
              </button>
              <button
                type="button"
                disabled={!currentUserId}
                onClick={() =>
                  currentUserId && set({ targetUserId: currentUserId, viewMode: "INDIVIDUAL" })
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${
                  isViewingSelf ? "bg-primary text-on-primary" : "text-on-surface-variant"
                }`}
              >
                My Performance
              </button>
            </div>

            <div className="space-y-1 min-w-[190px]">
              <label className="block font-label-sm text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
                Team Member
              </label>

              <SelectWrapper>
                <select
                  value={selectedEmployeeId ?? ""}
                  disabled={employeesLoading}
                  onChange={(e) => {
                    const employeeId = e.target.value || undefined;
                    if (!employeeId) {
                      set({ targetUserId: undefined, viewMode: "TEAM" });
                      return;
                    }
                    set({ targetUserId: employeeId, viewMode: "INDIVIDUAL" });
                  }}
                  className={selectClass}
                >
                  <option value="">All Team Members</option>
                  {employees
                    ?.filter((e) => e.role === "employee")
                    .map((employee) => (
                      <option key={employee._id} value={employee._id}>
                        {employee.name}
                      </option>
                    ))}
                </select>
              </SelectWrapper>
            </div>
          </>
        )}

        {/* CLEAR */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="ml-auto flex shrink-0 items-center gap-1 rounded-xl border border-error/20 bg-error/10 px-3.5 py-2.5 font-label-md text-xs font-bold text-error transition-all hover:bg-error/20"
          >
            <span className="material-symbols-outlined text-base">close</span>
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
};

export default PerformanceFilters;