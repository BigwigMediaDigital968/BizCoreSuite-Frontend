import { useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { ROLES } from "@/types/auth";
import { useBranchesQuery } from "@/features/branches";
import { useEmployeesQuery } from "@/features/employees";
import type { AttendanceFilterState } from "../components/Attendancefilters";
import { daysAgoInput, todayInput } from "@/utils/Date";
import { attendanceKeys, useAttendanceRecords, useAttendanceSummary } from "../hooks/useAttendance";
import RefreshButton from "@/components/ui/RefreshButton";
import AttendanceRecordsTable from "../components/Attendancerecordstable";
import AttendanceSummaryTable from "../components/Attendancesummarytable";
import AttendanceFilters from "../components/Attendancefilters";
import AttendanceSummaryCards from "../components/Attendancesummarycards";

const PAGE_SIZE = 15;

const DEFAULT_FILTERS: AttendanceFilterState = {
  dateFrom: daysAgoInput(6),
  dateTo: todayInput(),
  branchId: "",
  employeeId: "",
  status: "",
  workMode: "",
};

type Tab = "daily" | "summary";

const AdminAttendancePage = () => {
  const currentUser = useAuthStore((s) => s.user);
  const isHead = currentUser?.role === ROLES.HEAD;

  const [filters, setFilters] = useState<AttendanceFilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<Tab>("daily");

  // Reset to page 1 whenever the filter shape changes (adjusting during
  // render avoids an extra render-then-fetch-then-render cascade).
  const filtersKey = JSON.stringify(filters);
  const [trackedFiltersKey, setTrackedFiltersKey] = useState(filtersKey);
  if (filtersKey !== trackedFiltersKey) {
    setTrackedFiltersKey(filtersKey);
    setPage(1);
  }

  const { data: branches, isLoading: branchesLoading } = useBranchesQuery();

  // Head sees every branch; Admin's list is already scoped server-side to
  // just their assigned branches. Only bother showing the selector when
  // there's an actual choice to make.
  const showBranchFilter = (branches?.length ?? 0) > 1;

  const { data: employeesData, isLoading: employeesLoading } = useEmployeesQuery({
    role: "employee",
    branchId: filters.branchId || undefined,
    isActive: true,
    limit: 100,
  });

  const reportQuery = {
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    branchId: filters.branchId || undefined,
    employeeId: filters.employeeId || undefined,
  };

  const {
    data: summaryRows,
    isLoading: summaryLoading,
    isError: summaryError,
  } = useAttendanceSummary(reportQuery);

  const listQuery = {
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    branchId: filters.branchId || undefined,
    employeeId: filters.employeeId || undefined,
    status: filters.status || undefined,
    workMode: filters.workMode || undefined,
    page,
    limit: PAGE_SIZE,
  };

  const {
    data: recordsData,
    isLoading: recordsLoading,
    isFetching: recordsFetching,
    isError: recordsError,
  } = useAttendanceRecords(listQuery);

  const showBranchColumn = !filters.branchId;

  return (
    <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs tracking-wider uppercase mb-1">
            <span className="h-0.5 w-4 bg-primary rounded-full" />
            <span>Workforce Operations</span>
          </div>
          <h1 className="font-headline-md text-2xl sm:text-3xl font-extrabold text-on-surface">
            Attendance Overview
          </h1>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1 max-w-2xl">
            {isHead
              ? "Monitor check-ins, punctuality, and attendance trends across every branch in the organization."
              : "Monitor check-ins, punctuality, and attendance trends across your assigned branches."}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {(branches?.length ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-lowest border border-outline-variant/30 px-3.5 py-1.5 font-label-sm text-[11px] font-bold text-on-surface-variant shadow-sm">
              <span className="material-symbols-outlined text-sm text-primary">
                domain
              </span>
              {isHead
                ? `${branches?.length} ${branches?.length === 1 ? "Branch" : "Branches"} in scope`
                : `${branches?.length} Assigned ${branches?.length === 1 ? "Branch" : "Branches"}`}
            </span>
          )}

          <RefreshButton queryKey={attendanceKeys.all} />
        </div>
      </div>

      {/* Filters */}
      <AttendanceFilters
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
        branches={branches}
        branchesLoading={branchesLoading}
        showBranchFilter={showBranchFilter}
        employees={employeesData?.employees}
        employeesLoading={employeesLoading}
        branchLabel={isHead ? "All Branches" : "All My Branches"}
      />

      {/* KPI cards */}
      <AttendanceSummaryCards summary={summaryRows} isLoading={summaryLoading} />

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl bg-surface-container-low p-1 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("daily")}
          className={`px-4 py-2 rounded-lg font-label-md text-xs font-bold transition-all ${
            activeTab === "daily"
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          Daily Records
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("summary")}
          className={`px-4 py-2 rounded-lg font-label-md text-xs font-bold transition-all ${
            activeTab === "summary"
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          Employee Summary
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "daily" ? (
        <AttendanceRecordsTable
          data={recordsData}
          isLoading={recordsLoading}
          isFetching={recordsFetching}
          isError={recordsError}
          showBranchColumn={showBranchColumn}
          page={page}
          onPageChange={setPage}
        />
      ) : (
        <AttendanceSummaryTable
          rows={summaryRows}
          isLoading={summaryLoading}
          isError={summaryError}
        />
      )}
    </div>
  );
};

export default AdminAttendancePage;