import { useState } from "react";
import { ROLES } from "@/types/auth";
import { useAuthStore } from "@/store/auth.store";
import { useAttendanceRecords, useAttendanceSummary } from "../hooks/useAttendance";
import { useBranch } from "@/features/branches";
import { useEmployeesQuery } from "@/features/employees";
import { daysAgoInput, todayInput } from "@/utils/Date";

import AttendanceRecordsTable from "../components/Attendancerecordstable";
import AttendanceSummaryTable from "../components/Attendancesummarytable";
import AttendanceFilters, { type AttendanceFilterState } from "../components/Attendancefilters";
import AttendanceSummaryCards from "../components/Attendancesummarycards";


const TEAM_PAGE_SIZE = 10;

const TEAM_DEFAULT_FILTERS: AttendanceFilterState = {
    dateFrom: daysAgoInput(6),
    dateTo: todayInput(),
    branchId: "",
    employeeId: "",
    status: "",
    workMode: "",
};

const TeamAttendanceTab = () => {
    const user = useAuthStore((state) => state.user);
    const { data: branch, isLoading: branchLoading, } = useBranch(user?.branches[0]);
    const isManager = user?.role === ROLES.MANAGER;
    const [teamFilters, setTeamFilters] = useState<AttendanceFilterState>(TEAM_DEFAULT_FILTERS);
    const [teamPage, setTeamPage] = useState(1);
    const [teamTab, setTeamTab] = useState<"daily" | "summary">("daily");

    const teamFiltersKey = JSON.stringify(teamFilters);
    const [trackedTeamFiltersKey, setTrackedTeamFiltersKey] = useState(teamFiltersKey);
    if (teamFiltersKey !== trackedTeamFiltersKey) {
        setTrackedTeamFiltersKey(teamFiltersKey);
        setTeamPage(1);
    }

    const managerBranchId = user?.branches?.[0];

    // Employees on the manager's own branch, for the employee filter dropdown.
    const { data: teamEmployeesData, isLoading: teamEmployeesLoading } = useEmployeesQuery({
        role: "employee",
        branchId: managerBranchId,
        isActive: true,
        limit: 100,
    });

    const teamReportQuery = {
        dateFrom: teamFilters.dateFrom,
        dateTo: teamFilters.dateTo,
        branchId: managerBranchId,
        employeeId: teamFilters.employeeId || undefined,
    };

    const {
        data: teamSummaryRows,
        isLoading: teamSummaryLoading,
        isError: teamSummaryError,
    } = useAttendanceSummary(teamReportQuery, true);

    const teamListQuery = {
        dateFrom: teamFilters.dateFrom,
        dateTo: teamFilters.dateTo,
        branchId: managerBranchId,
        employeeId: teamFilters.employeeId || undefined,
        status: teamFilters.status || undefined,
        workMode: teamFilters.workMode || undefined,
        page: teamPage,
        limit: TEAM_PAGE_SIZE,
    };

    const {
        data: teamRecordsData,
        isLoading: teamRecordsLoading,
        isFetching: teamRecordsFetching,
        isError: teamRecordsError,
    } = useAttendanceRecords(teamListQuery);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            

            {/* TEAM ATTENDANCE TAB CONTENT (Manager View Only) */}
            {isManager && (
                <div className="space-y-6">
                    {/* Filters */}
                    <AttendanceFilters
                        filters={teamFilters}
                        onChange={setTeamFilters}
                        onReset={() => setTeamFilters(TEAM_DEFAULT_FILTERS)}
                        branches={branch ? [branch] : []}
                        branchesLoading={branchLoading}
                        showBranchFilter={false}
                        employees={teamEmployeesData?.employees}
                        employeesLoading={teamEmployeesLoading}
                        branchLabel="My Team"
                    />

                    {/* KPI cards */}
                    <AttendanceSummaryCards summary={teamSummaryRows} isLoading={teamSummaryLoading} />

                    {/* Sub-tabs */}
                    <div className="flex items-center gap-1 rounded-xl bg-surface-container-low p-1 w-fit">
                        <button
                            type="button"
                            onClick={() => setTeamTab("daily")}
                            className={`px-4 py-2 rounded-lg font-label-md text-xs font-bold transition-all ${teamTab === "daily"
                                ? "bg-primary text-on-primary shadow-sm"
                                : "text-on-surface-variant hover:bg-surface-container"
                                }`}
                        >
                            Daily Records
                        </button>
                        <button
                            type="button"
                            onClick={() => setTeamTab("summary")}
                            className={`px-4 py-2 rounded-lg font-label-md text-xs font-bold transition-all ${teamTab === "summary"
                                ? "bg-primary text-on-primary shadow-sm"
                                : "text-on-surface-variant hover:bg-surface-container"
                                }`}
                        >
                            Employee Summary
                        </button>
                    </div>

                    {/* Table */}
                    {teamTab === "daily" ? (
                        <AttendanceRecordsTable
                            data={teamRecordsData}
                            isLoading={teamRecordsLoading}
                            isFetching={teamRecordsFetching}
                            isError={teamRecordsError}
                            showBranchColumn={false}
                            page={teamPage}
                            onPageChange={setTeamPage}
                        />
                    ) : (
                        <AttendanceSummaryTable
                            rows={teamSummaryRows}
                            isLoading={teamSummaryLoading}
                            isError={teamSummaryError}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default TeamAttendanceTab;