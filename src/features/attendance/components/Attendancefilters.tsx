import {
  ATTENDANCE_STATUS,
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_WORK_MODE,
  ATTENDANCE_WORK_MODE_LABELS,
  type AttendanceStatus,
  type AttendanceWorkMode,
} from "@/types/attendance";
import type { Branch } from "@/types/branch";
import type { Employee } from "@/types/employee";

export interface AttendanceFilterState {
  dateFrom: string;
  dateTo: string;
  branchId: string;
  employeeId: string;
  status: AttendanceStatus | "";
  workMode: AttendanceWorkMode | "";
}

interface AttendanceFiltersProps {
  filters: AttendanceFilterState;
  onChange: (next: AttendanceFilterState) => void;
  onReset: () => void;
  /** Branch dropdown — omitted entirely for actors scoped to a single branch. */
  branches?: Branch[];
  branchesLoading?: boolean;
  /** Whether to show the branch selector at all (Head always; Admin only if >1 branch). */
  showBranchFilter: boolean;
  employees?: Employee[];
  employeesLoading?: boolean;
  branchLabel: string;
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

const AttendanceFilters = ({
  filters,
  onChange,
  onReset,
  branches,
  branchesLoading,
  showBranchFilter,
  employees,
  employeesLoading,
  branchLabel,
}: AttendanceFiltersProps) => {
  const hasActiveFilters = Boolean(
    filters.branchId || filters.employeeId || filters.status || filters.workMode
  );

  const set = (patch: Partial<AttendanceFilterState>) =>
    onChange({ ...filters, ...patch });

  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        {/* Date range */}
        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <label className="block font-label-sm text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
              From
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              max={filters.dateTo}
              onChange={(e) => set({ dateFrom: e.target.value })}
              className={dateClass}
            />
          </div>
          <div className="space-y-1">
            <label className="block font-label-sm text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
              To
            </label>
            <input
              type="date"
              value={filters.dateTo}
              min={filters.dateFrom}
              onChange={(e) => set({ dateTo: e.target.value })}
              className={dateClass}
            />
          </div>
        </div>

        {/* Branch */}
        {showBranchFilter && (
          <div className="space-y-1 min-w-[170px]">
            <label className="block font-label-sm text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
              Branch
            </label>
            <SelectWrapper>
              <select
                value={filters.branchId}
                disabled={branchesLoading}
                onChange={(e) =>
                  set({ branchId: e.target.value, employeeId: "" })
                }
                className={selectClass}
              >
                <option value="">{branchLabel}</option>
                {branches?.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </SelectWrapper>
          </div>
        )}

        {/* Employee */}
        <div className="space-y-1 min-w-[190px]">
          <label className="block font-label-sm text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
            Employee
          </label>
          <SelectWrapper>
            <select
              value={filters.employeeId}
              disabled={employeesLoading}
              onChange={(e) => set({ employeeId: e.target.value })}
              className={selectClass}
            >
              <option value="">All Employees</option>
              {employees?.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </SelectWrapper>
        </div>

        {/* Status */}
        <div className="space-y-1 min-w-[140px]">
          <label className="block font-label-sm text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
            Status
          </label>
          <SelectWrapper>
            <select
              value={filters.status}
              onChange={(e) =>
                set({ status: e.target.value as AttendanceStatus | "" })
              }
              className={selectClass}
            >
              <option value="">All Statuses</option>
              {Object.values(ATTENDANCE_STATUS).map((s) => (
                <option key={s} value={s}>
                  {ATTENDANCE_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </SelectWrapper>
        </div>

        {/* Work mode */}
        <div className="space-y-1 min-w-[130px]">
          <label className="block font-label-sm text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
            Work Mode
          </label>
          <SelectWrapper>
            <select
              value={filters.workMode}
              onChange={(e) =>
                set({ workMode: e.target.value as AttendanceWorkMode | "" })
              }
              className={selectClass}
            >
              <option value="">All Modes</option>
              {Object.values(ATTENDANCE_WORK_MODE).map((m) => (
                <option key={m} value={m}>
                  {ATTENDANCE_WORK_MODE_LABELS[m]}
                </option>
              ))}
            </select>
          </SelectWrapper>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 rounded-xl border border-error/20 bg-error/10 px-3.5 py-2.5 font-label-md text-xs font-bold text-error hover:bg-error/20 transition-all shrink-0 ml-auto"
          >
            <span className="material-symbols-outlined text-base">close</span>
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
};

export default AttendanceFilters;