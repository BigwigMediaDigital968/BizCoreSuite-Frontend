import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { TaskOverviewWidget } from "@/features/tasks";
import { useEmployeesQuery } from "@/features/employees";
import { useBranchesQuery } from "@/features/branches/hooks/useBranches";
import { useLeads } from "@/features/leads/hooks/useLeads";
import { useAuditLogs } from "@/features/logs/hooks/useAuditLogs";
import ActionBadge from "@/features/logs/components/ActionBadge";
import { useDashboardReport } from "../hooks/useDashboardReport";
import ExportReportButton from "../components/ExportReportButton";

const TIMEFRAMES = ["This Week", "This Month", "This Quarter"] as const;
type Timeframe = (typeof TIMEFRAMES)[number];

const PERFORMANCE_TIMEFRAMES = ["Daily", "Weekly", "Monthly"] as const;
type PerformanceTimeframe = (typeof PERFORMANCE_TIMEFRAMES)[number];

const timeframeRange = (timeframe: Timeframe) => {
  const endDate = new Date();
  const startDate = new Date();
  if (timeframe === "This Week") startDate.setDate(endDate.getDate() - 7);
  else if (timeframe === "This Quarter")
    startDate.setMonth(endDate.getMonth() - 3);
  else startDate.setMonth(endDate.getMonth() - 1);
  return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
};

const getPerformanceDateRange = (period: PerformanceTimeframe) => {
  const endDate = new Date();
  const startDate = new Date();

  if (period === "Daily") {
    startDate.setHours(0, 0, 0, 0);
  } else if (period === "Weekly") {
    startDate.setDate(endDate.getDate() - 7);
  } else if (period === "Monthly") {
    startDate.setMonth(endDate.getMonth() - 1);
  }

  return {
    perfStartDate: startDate.toISOString(),
    perfEndDate: endDate.toISOString(),
  };
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const AdminDashboardPage = () => {
  const navigate = useNavigate();

  const [selectedTimeframe] = useState<Timeframe>("This Month");
  const [performancePeriod, setPerformancePeriod] =
    useState<PerformanceTimeframe>("Monthly");

  const { data: usersData, isLoading: usersLoading } = useEmployeesQuery({
    limit: 5,
  });
  const { data: activeUsersData } = useEmployeesQuery({
    isActive: true,
    limit: 1,
  });
  const { data: branches, isLoading: branchesLoading } = useBranchesQuery();
  const { data: leadsData, isLoading: leadsLoading } = useLeads({ limit: 1 });

  const { data: auditData, isLoading: auditLoading } = useAuditLogs({
    limit: 5,
  });

  const combinedFilters = useMemo(() => {
    const mainRange = timeframeRange(selectedTimeframe);
    const perfRange = getPerformanceDateRange(performancePeriod);

    return {
      ...mainRange,
      perfStartDate: perfRange.perfStartDate,
      perfEndDate: perfRange.perfEndDate,
      performancePeriod,
    };
  }, [selectedTimeframe, performancePeriod]);

  const timeframeFilters = useMemo(
    () => timeframeRange(selectedTimeframe),
    [selectedTimeframe],
  );

  const { data: dashboardReport, isLoading: reportLoading } =
    useDashboardReport(combinedFilters);

  const activeBranches = (branches ?? []).filter((b) => b.isActive);
  const totalUsers = usersData?.pagination.total ?? 0;
  const activeUsers = activeUsersData?.pagination.total ?? 0;

  const totalRevenue = dashboardReport?.revenue?.total ?? 0;
  const todaysRevenue = dashboardReport?.revenue?.today ?? 0;
  const topBranchData = dashboardReport?.topPerformers?.branch;
  const topEmployeeData = dashboardReport?.topPerformers?.employee;

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Left: Section Details */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-indigo-600 font-bold text-xs tracking-wider uppercase bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
            <span className="material-symbols-outlined text-sm">
              admin_panel_settings
            </span>
            <span>System Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Overview performance, access control, and operations across your
            assigned branches.
          </p>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 hidden xl:flex">
            <span className="material-symbols-outlined text-slate-400 text-base">
              bolt
            </span>
            <span>Actions</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <ExportReportButton filters={timeframeFilters} />

            <button
              onClick={() => navigate("/leads")}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined text-base text-sky-600">
                hub
              </span>
              <span>Leads</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. System & Revenue Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Performance Card */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Managed Revenue
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <span className="material-symbols-outlined text-lg">
                payments
              </span>
            </span>
          </div>
          {reportLoading ? (
            <div className="h-8 w-24 rounded-lg bg-emerald-100/60 animate-pulse" />
          ) : (
            <div>
              <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {formatCurrency(totalRevenue)}
              </p>
              <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                Today: {formatCurrency(todaysRevenue)}
              </p>
            </div>
          )}
        </div>

        {/* User Management Stat */}
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5 shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">
              System Users
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <span className="material-symbols-outlined text-lg">
                manage_accounts
              </span>
            </span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {usersLoading ? "…" : totalUsers}
          </p>
          <p className="text-[11px] font-medium text-indigo-700 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">
              check_circle
            </span>
            {usersLoading
              ? "Loading…"
              : `${activeUsers} Active • ${totalUsers - activeUsers} Inactive`}
          </p>
        </div>

        {/* Branch Control Stat */}
        <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-5 shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800">
              Active Branches
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <span className="material-symbols-outlined text-lg">
                storefront
              </span>
            </span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {branchesLoading
              ? "…"
              : String(activeBranches.length).padStart(2, "0")}
          </p>
          <p className="text-[11px] font-medium text-sky-700 truncate">
            {branchesLoading
              ? "Loading…"
              : activeBranches.map((b) => b.name).join(", ") ||
                "No active branches"}
          </p>
        </div>

        {/* Leads Stat */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Total Leads
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <span className="material-symbols-outlined text-lg">hub</span>
            </span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {leadsLoading ? "…" : (leadsData?.pagination.total ?? 0)}
          </p>
          <p className="text-[11px] font-medium text-amber-700">
            Across managed branches
          </p>
        </div>
      </div>

      {/* 3. Assigned Branch Performance Showcase */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Assigned Branch Performance
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Performance breakdown for branches under your administration.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 border border-slate-200/80">
            {PERFORMANCE_TIMEFRAMES.map((ptf) => (
              <button
                key={ptf}
                onClick={() => setPerformancePeriod(ptf)}
                className={`px-3 py-1 rounded-lg text-xs transition-all ${
                  performancePeriod === ptf
                    ? "bg-white text-indigo-600 font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {ptf}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Performing Branch in Scope */}
          <div className="rounded-xl border border-amber-200/60 bg-gradient-to-b from-amber-50/40 to-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">
                  emoji_events
                </span>
                Leading Branch
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase bg-white px-2 py-0.5 rounded-full border border-slate-200">
                {performancePeriod}
              </span>
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">
                {topBranchData?.name ?? "—"}
              </p>
              <p className="text-xs text-slate-500">
                {topBranchData?.code
                  ? `Code: ${topBranchData.code}`
                  : "No recorded activity"}
              </p>
            </div>
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                Volume Generated
              </span>
              <span className="text-sm font-extrabold text-indigo-600">
                {formatCurrency(topBranchData?.revenue ?? 0)}
              </span>
            </div>
          </div>

          {/* Top Representative */}
          <div className="rounded-xl border border-indigo-200/60 bg-gradient-to-b from-indigo-50/40 to-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">
                  military_tech
                </span>
                Top Representative
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase bg-white px-2 py-0.5 rounded-full border border-slate-200">
                {performancePeriod}
              </span>
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">
                {topEmployeeData?.name ?? "—"}
              </p>
              <p className="text-xs text-slate-500">
                {topEmployeeData?.branchName ?? "No recorded activity"}
              </p>
            </div>
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                Revenue Contribution
              </span>
              <span className="text-sm font-extrabold text-indigo-600">
                {formatCurrency(topEmployeeData?.revenue ?? 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Task Overview */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <TaskOverviewWidget
          title="Task Load Overview"
          description="Task load across the branches you manage."
        />
      </div>

      {/* 4. Core Management Section (User Management & Audit Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (User Directory Table) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                User Directory & Access Control
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage roles, statuses, and branch assignments.
              </p>
            </div>

            <Link
              to="/employees"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors self-start sm:self-auto"
            >
              View All Users
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">System Role</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                {usersLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="py-3.5 px-4">
                        <div className="h-6 rounded-lg bg-slate-100 animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : (usersData?.employees ?? []).length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-6 px-4 text-center text-slate-400"
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  usersData!.employees.map((user) => (
                    <tr
                      key={user._id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-slate-900">
                            {user.name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {user.email}
                          </p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold capitalize text-slate-700">
                        {user.role}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {user.branches?.[0]?.name ?? "—"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            user.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              user.isActive ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/employees/${user._id}/edit`}
                          aria-label="Edit User"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">
                            edit
                          </span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Security Audit Trail */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-700 text-xl">
                security
              </span>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Audit Trail Log
              </h3>
            </div>
            <Link
              to="/logs"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              View All
            </Link>
          </div>

          <div className="space-y-3 divide-y divide-slate-100">
            {auditLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="pt-3 first:pt-0">
                  <div className="h-10 rounded-lg bg-slate-100 animate-pulse" />
                </div>
              ))
            ) : (auditData?.logs ?? []).length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">
                No audit activity recorded yet.
              </p>
            ) : (
              auditData!.logs.map((log) => (
                <div key={log._id} className="pt-3 first:pt-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <ActionBadge action={log.action} />
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(log.createdAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 font-medium">
                    {log.description ?? log.entityId ?? "System Action"}
                  </p>
                  {log.performedBy && (
                    <p className="text-[10px] text-slate-400">
                      {log.performedBy.name}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
