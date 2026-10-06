import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useBranchesQuery } from "@/features/branches";
import {
  useEmployeeCountsByBranch,
  useEmployeesQuery,
} from "@/features/employees";
import { TaskOverviewWidget } from "@/features/tasks";
import { useLeads } from "@/features/leads";
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

const formatStatus = (status: string) =>
  status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const HeadDashboardPage = () => {
  const [selectedTimeframe] = useState<Timeframe>("This Month");
  const [performancePeriod, setPerformancePeriod] =
    useState<PerformanceTimeframe>("Monthly");

  const { data: branches, isLoading: branchesLoading } = useBranchesQuery();
  const { data: employeesData, isLoading: employeesLoading } =
    useEmployeesQuery({
      limit: 1,
    });

  const branchIds = useMemo(
    () => branches?.map((b) => b._id) ?? [],
    [branches],
  );
  const { counts: employeeCountsByBranch } =
    useEmployeeCountsByBranch(branchIds);

  const totalEmployees = employeesData?.pagination.total;
  const totalBranches = branches?.length;

  const { data: leadData, isLoading: leadLoading } = useLeads({
    limit: 1,
  });

  const totalLeads = leadData?.pagination?.total;

  const { data: recentLeadsData, isLoading: recentLeadsLoading } = useLeads({
    limit: 5,
    sortBy: "createdAt",
    sortOrder: "desc",
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

  const statusBreakdown = dashboardReport?.leads.statusBreakdown ?? [];
  const maxStatusCount = Math.max(1, ...statusBreakdown.map((s) => s.count));

  const topBranches = useMemo(() => (branches ?? []).slice(0, 3), [branches]);

  const { data: recentLogsData, isLoading: recentLogsLoading } = useAuditLogs({
    limit: 5,
  });

  const todaysRevenue = dashboardReport?.revenue?.today ?? 0;
  const totalRevenue = dashboardReport?.revenue?.total ?? 0;
  const topBranchData = dashboardReport?.topPerformers?.branch;
  const topEmployeeData = dashboardReport?.topPerformers?.employee;
  const topAdminData = dashboardReport?.topPerformers?.admin;

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs tracking-wider uppercase mb-1">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
            <span>Executive Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Head Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time insights across regional operations, sales pipelines, and
            organizational metrics.
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-lg">
              bolt
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Quick Actions
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <ExportReportButton filters={timeframeFilters} />

            <Link
              to="/employees/onboard"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-all"
            >
              <span className="material-symbols-outlined text-base">
                person_add
              </span>
              <span>Onboard Employee</span>
            </Link>

            <Link
              to="/branches/new"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all"
            >
              <span className="material-symbols-outlined text-base text-indigo-600">
                add_business
              </span>
              <span>New Branch</span>
            </Link>

            <Link
              to="/leads"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all"
            >
              <span className="material-symbols-outlined text-base text-sky-600">
                person_search
              </span>
              <span>Add Lead</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid (Light Colored Data Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Today's Revenue Card */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-xs space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Today's Revenue
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <span className="material-symbols-outlined text-lg">
                payments
              </span>
            </span>
          </div>
          {reportLoading ? (
            <div className="h-8 w-28 rounded-lg bg-emerald-100/60 animate-pulse" />
          ) : (
            <div>
              <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {formatCurrency(todaysRevenue)}
              </p>
              <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                Period Revenue: {formatCurrency(totalRevenue)}
              </p>
            </div>
          )}
          <Link
            to="/revenue"
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
          >
            <span>Revenue Breakdown</span>
            <span className="material-symbols-outlined text-sm">
              chevron_right
            </span>
          </Link>
        </div>

        {/* Total Revenue Selected Range */}
        <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-5 shadow-xs space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-violet-800">
              Total Revenue
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <span className="material-symbols-outlined text-lg">
                account_balance_wallet
              </span>
            </span>
          </div>
          {reportLoading ? (
            <div className="h-8 w-28 rounded-lg bg-violet-100/60 animate-pulse" />
          ) : (
            <div>
              <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {formatCurrency(totalRevenue)}
              </p>
              <p className="text-[11px] text-violet-700 font-medium mt-0.5">
                Range: {selectedTimeframe}
              </p>
            </div>
          )}
          <Link
            to="/revenue"
            className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 hover:text-violet-900 transition-colors"
          >
            <span>View Statements</span>
            <span className="material-symbols-outlined text-sm">
              chevron_right
            </span>
          </Link>
        </div>

        {/* Total Leads */}
        <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-5 shadow-xs space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800">
              Total Leads
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <span className="material-symbols-outlined text-lg">
                leaderboard
              </span>
            </span>
          </div>
          {leadLoading ? (
            <div className="h-8 w-16 rounded-lg bg-sky-100/60 animate-pulse" />
          ) : (
            <div>
              <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {totalLeads ?? 0}
              </p>
              <p className="text-[11px] text-sky-700 font-medium mt-0.5">
                Active lead opportunities
              </p>
            </div>
          )}
          <Link
            to="/leads"
            className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-900 transition-colors"
          >
            <span>Manage Leads</span>
            <span className="material-symbols-outlined text-sm">
              chevron_right
            </span>
          </Link>
        </div>

        {/* Total Workforce */}
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5 shadow-xs space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">
              Employees
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <span className="material-symbols-outlined text-lg">badge</span>
            </span>
          </div>
          {employeesLoading ? (
            <div className="h-8 w-16 rounded-lg bg-indigo-100/60 animate-pulse" />
          ) : (
            <div>
              <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {totalEmployees ?? 0}
              </p>
              <p className="text-[11px] text-indigo-700 font-medium mt-0.5">
                Across all locations
              </p>
            </div>
          )}
          <Link
            to="/employees"
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 transition-colors"
          >
            <span>Directory</span>
            <span className="material-symbols-outlined text-sm">
              chevron_right
            </span>
          </Link>
        </div>

        {/* Active Branches */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Branches
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <span className="material-symbols-outlined text-lg">domain</span>
            </span>
          </div>
          {branchesLoading ? (
            <div className="h-8 w-16 rounded-lg bg-amber-100/60 animate-pulse" />
          ) : (
            <div>
              <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {String(totalBranches ?? 0).padStart(2, "0")}
              </p>
              <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                Operating Hubs
              </p>
            </div>
          )}
          <Link
            to="/branches"
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors"
          >
            <span>View All</span>
            <span className="material-symbols-outlined text-sm">
              chevron_right
            </span>
          </Link>
        </div>
      </div>

      {/* Top Performers Grid */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Top Performers Showcase
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Leading branches, representatives, and managers based on output.
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Top Branch */}
          <div className="rounded-xl border border-amber-200/60 bg-gradient-to-b from-amber-50/40 to-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">
                  emoji_events
                </span>
                Top Branch
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
                Revenue
              </span>
              <span className="text-sm font-extrabold text-indigo-600">
                {formatCurrency(topBranchData?.revenue ?? 0)}
              </span>
            </div>
          </div>

          {/* Top Employee */}
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
                Generated
              </span>
              <span className="text-sm font-extrabold text-indigo-600">
                {formatCurrency(topEmployeeData?.revenue ?? 0)}
              </span>
            </div>
          </div>

          {/* Top Admin */}
          <div className="rounded-xl border border-sky-200/60 bg-gradient-to-b from-sky-50/40 to-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">
                  workspace_premium
                </span>
                Top Regional Admin
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase bg-white px-2 py-0.5 rounded-full border border-slate-200">
                {performancePeriod}
              </span>
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">
                {topAdminData?.name ?? "—"}
              </p>
              <p className="text-xs text-slate-500">
                {topAdminData?.managedBranch ?? "Regional Operations"}
              </p>
            </div>
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                Managed Volume
              </span>
              <span className="text-sm font-extrabold text-indigo-600">
                {formatCurrency(topAdminData?.revenue ?? 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Streamlined Task Overview Widget */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <TaskOverviewWidget
          title="Task Load Overview"
          description="Summary counts of active assignments across teams."
        />
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Lead Distribution Chart & Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Leads by Status Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Leads Stage Breakdown
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedTimeframe} · {dashboardReport?.leads.totalLeads ?? 0}{" "}
                  leads total
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {reportLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-8 rounded-xl bg-slate-100 animate-pulse"
                  />
                ))
              ) : statusBreakdown.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No lead records found for this timeframe.
                </div>
              ) : (
                statusBreakdown
                  .slice()
                  .sort((a, b) => b.count - a.count)
                  .map((entry) => {
                    const percentage = (
                      (entry.count / (dashboardReport?.leads.totalLeads || 1)) *
                      100
                    ).toFixed(1);

                    return (
                      <div key={entry.status} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">
                            {formatStatus(entry.status)}
                          </span>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-slate-500">
                              {entry.count}
                            </span>
                            <span className="text-[10px] text-slate-400 font-sans">
                              ({percentage}%)
                            </span>
                          </div>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                            style={{
                              width: `${(entry.count / maxStatusCount) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* Recent Leads Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Recent Leads
              </h3>
              <Link
                to="/leads"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                View All
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {recentLeadsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4">
                    <div className="h-10 rounded-xl bg-slate-100 animate-pulse" />
                  </div>
                ))
              ) : (recentLeadsData?.leads ?? []).length === 0 ? (
                <p className="p-6 text-center text-xs text-slate-400">
                  No recent leads registered.
                </p>
              ) : (
                recentLeadsData!.leads.map((lead) => {
                  const branchName =
                    lead.branch && typeof lead.branch === "object"
                      ? lead.branch.name
                      : "—";
                  return (
                    <Link
                      to={`/leads/${lead._id}`}
                      key={lead._id}
                      className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {lead.name}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {branchName} · {lead.phone}
                        </p>
                      </div>

                      <span className="inline-block rounded-full bg-sky-50 border border-sky-200 px-2.5 py-0.5 text-[10px] font-bold text-sky-700 shrink-0">
                        {formatStatus(lead.status)}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Branch Distribution & Audit Logs */}
        <div className="space-y-6">
          {/* Branch Overview */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-4 shadow-xs">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Top Branches
            </h3>

            {branchesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-14 rounded-xl bg-slate-100 animate-pulse"
                  />
                ))}
              </div>
            ) : !branches || branches.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No active branches configured.
              </div>
            ) : (
              <div className="space-y-3">
                {topBranches.map((branch) => (
                  <div
                    key={branch._id}
                    className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900">
                        {branch.name}
                      </p>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                        {branch.code}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        {employeeCountsByBranch[branch._id] ?? "…"} Employees
                      </span>
                      {branch.city && <span>{branch.city}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Link
              to="/branches"
              className="block w-full py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 text-center hover:bg-slate-100 transition-colors"
            >
              Branch Directory
            </Link>
          </div>

          {/* Activity Log */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Latest Audit Logs
              </h3>
              <Link
                to="/logs"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                View All
              </Link>
            </div>

            <div className="space-y-3 divide-y divide-slate-100">
              {recentLogsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="pt-3 first:pt-0">
                    <div className="h-10 rounded-xl bg-slate-100 animate-pulse" />
                  </div>
                ))
              ) : (recentLogsData?.logs ?? []).length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-400">
                  No system logs recorded.
                </p>
              ) : (
                recentLogsData!.logs.map((log) => (
                  <div key={log._id} className="pt-3 first:pt-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <ActionBadge action={log.action} />
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {new Date(log.createdAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 font-medium">
                      {log.description}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {log.performedBy?.name ?? "System"}
                      {log.branch?.name ? ` · ${log.branch.name}` : ""}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeadDashboardPage;
