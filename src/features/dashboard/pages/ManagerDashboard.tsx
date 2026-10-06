import { Link } from "react-router";
import { useLeads, useMyFollowUps } from "@/features/leads/hooks/useLeads";
import { useEmployeesQuery } from "@/features/employees";
import { useRevenueReportQuery } from "@/features/revenue/hooks/useRevenue";
import TaskOverviewWidget from "@/features/tasks/components/TaskOverviewWidget";
import { REVENUE_STATUS, type RevenueStatusSummary } from "@/types/revenue";

const formatInr = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

const ManagerDashboard = () => {
  const { data: leadsData, isLoading: leadsLoading } = useLeads({ limit: 1 });
  const { data: employeesData, isLoading: employeesLoading } =
    useEmployeesQuery({ limit: 6 });
  const { data: revenueData, isLoading: revenueLoading } =
    useRevenueReportQuery({
      viewMode: "TEAM",
    });
  const { data: followUps, isLoading: followUpsLoading } = useMyFollowUps();

  const verifiedRevenue = Array.isArray(revenueData?.summary)
    ? ((revenueData.summary as RevenueStatusSummary[]).find(
        (s) => s._id === REVENUE_STATUS.VERIFIED,
      )?.totalAmount ?? 0)
    : 0;

  const pendingFollowUps = (followUps ?? []).filter(
    (f) => f.status === "PENDING",
  );

  const stats = [
    {
      title: "Total Leads",
      value: leadsLoading ? "…" : String(leadsData?.pagination.total ?? 0),
      icon: "filter_alt",
      badge: "Pipeline",
      color: "text-sky-600 bg-sky-50 border-sky-100",
    },
    {
      title: "Verified Revenue",
      value: revenueLoading ? "…" : formatInr(verifiedRevenue),
      icon: "payments",
      badge: "Realized",
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      title: "Team Size",
      value: employeesLoading
        ? "…"
        : String(employeesData?.pagination.total ?? 0),
      icon: "badge",
      badge: "Active Roster",
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
    },
    {
      title: "Pending Follow-ups",
      value: followUpsLoading ? "…" : String(pendingFollowUps.length),
      icon: "schedule",
      badge: "Action Req.",
      color: "text-amber-600 bg-amber-50 border-amber-100",
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto font-sans">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Manager Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Live pipeline, team load, and daily follow-up snapshot for your
            branch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/performance"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-base text-indigo-600">
              analytics
            </span>
            <span>Performance</span>
          </Link>
          <Link
            to="/tasks/new"
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-base">
              add_task
            </span>
            <span>Assign Task</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-sm transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {stat.title}
              </span>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl border ${stat.color}`}
              >
                <span className="material-symbols-outlined text-xl">
                  {stat.icon}
                </span>
              </div>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <div className="text-md sm:text-xl font-bold text-slate-900 tracking-tight">
                {stat.value}
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {stat.badge}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Section (2 Columns): Team Directory & Task Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Team Directory */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span>Team Directory</span>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                    {employeesData?.employees?.length ?? 0}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Roster breakdown and status for assigned members
                </p>
              </div>
              <span className="material-symbols-outlined text-slate-400">
                group
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3 rounded-l-lg">Employee</th>
                    <th className="py-2.5 px-3">Branch</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right rounded-r-lg">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {employeesLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={4} className="py-3 px-3">
                          <div className="h-6 rounded-lg bg-slate-100 animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : (employeesData?.employees ?? []).length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-8 px-3 text-center text-slate-400"
                      >
                        No team members found in this branch.
                      </td>
                    </tr>
                  ) : (
                    employeesData!.employees.map((member) => (
                      <tr
                        key={member._id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs uppercase shrink-0">
                              {member.name ? member.name.charAt(0) : "U"}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">
                                {member.name}
                              </div>
                              <div className="text-[11px] text-slate-400 capitalize">
                                {member.role}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-medium">
                          {member.branches[0]?.name ?? "Unassigned"}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              member.isActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                : "bg-rose-50 text-rose-700 border border-rose-200/60"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                member.isActive
                                  ? "bg-emerald-500"
                                  : "bg-rose-500"
                              }`}
                            />
                            {member.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            to={`/employees/${member._id}/profile`}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-2xs"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Link
              to="/employees"
              className="flex items-center justify-center gap-1 w-full py-2.5 rounded-xl border border-dashed border-slate-200 text-xs font-bold text-indigo-600 hover:bg-indigo-50/50 transition-all"
            >
              <span>View Full Team Roster</span>
              <span className="material-symbols-outlined text-sm">
                arrow_forward
              </span>
            </Link>
          </div>

          <TaskOverviewWidget
            title="Task Overview"
            description="Task distribution and workloads across your branch team."
          />
        </div>

        {/* Right Section (1 Column): Follow-ups & Management Shortcuts */}
        <div className="space-y-6">
          {/* Pending Follow-ups */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900">
                  Pending Follow-ups
                </h2>
                {pendingFollowUps.length > 0 && (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {pendingFollowUps.length}
                  </span>
                )}
              </div>
              <span className="material-symbols-outlined text-slate-400">
                schedule
              </span>
            </div>

            <div className="space-y-2.5">
              {followUpsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 rounded-xl bg-slate-100 animate-pulse"
                  />
                ))
              ) : pendingFollowUps.length === 0 ? (
                <div className="py-6 text-center space-y-1">
                  <span className="material-symbols-outlined text-emerald-500 text-2xl">
                    check_circle
                  </span>
                  <p className="text-xs font-bold text-slate-700">
                    All caught up!
                  </p>
                  <p className="text-[11px] text-slate-400">
                    No pending follow-ups scheduled.
                  </p>
                </div>
              ) : (
                pendingFollowUps.slice(0, 5).map((item) => {
                  const lead = typeof item.lead === "object" ? item.lead : null;
                  return (
                    <div
                      key={item._id}
                      className="group rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 space-y-2 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {lead?.name ?? "Lead Follow-up"}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-100">
                          {lead?.status ?? item.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center justify-between pt-0.5">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-slate-400">
                            call
                          </span>
                          {lead?.phone || "N/A"}
                        </span>
                        <span className="font-mono text-[10px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200/80">
                          {new Date(item.scheduledAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <Link
              to="/leads"
              className="flex items-center justify-center gap-1 w-full text-xs font-bold text-slate-600 hover:text-indigo-600 pt-1 transition-colors"
            >
              <span>View All Lead Follow-ups</span>
              <span className="material-symbols-outlined text-sm">
                chevron_right
              </span>
            </Link>
          </div>

          {/* Quick Actions Shortcuts */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Management Shortcuts
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              <Link
                to="/leads"
                className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] transition-all"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                  <span className="material-symbols-outlined text-base">
                    person_add
                  </span>
                </div>
                <span>Leads</span>
              </Link>

              <Link
                to="/tasks/new"
                className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] transition-all"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <span className="material-symbols-outlined text-base">
                    add_task
                  </span>
                </div>
                <span>Assign Task</span>
              </Link>

              <Link
                to="/revenue/create"
                className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] transition-all"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <span className="material-symbols-outlined text-base">
                    payments
                  </span>
                </div>
                <span>Log Revenue</span>
              </Link>

              <Link
                to="/performance"
                className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] transition-all"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <span className="material-symbols-outlined text-base">
                    analytics
                  </span>
                </div>
                <span>Reports</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
