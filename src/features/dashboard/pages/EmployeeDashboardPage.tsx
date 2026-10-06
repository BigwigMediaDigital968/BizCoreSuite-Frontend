import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { useAuthStore } from "@/store/auth.store";
import { useLeads, useMyFollowUps } from "@/features/leads/hooks/useLeads";
import { useAttendanceRecords } from "@/features/attendance/hooks/useAttendance";
import { useRevenueReportQuery } from "@/features/revenue/hooks/useRevenue";
import { REVENUE_STATUS, type RevenueStatusSummary } from "@/types/revenue";
import TaskOverviewWidget from "@/features/tasks/components/TaskOverviewWidget";
import { todayInput } from "@/utils/Date";
import { DailyAttendanceCard } from "../components/DailyAttendanceCard";

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const isFollowUpOverdue = (scheduledAt: string) =>
  new Date(scheduledAt).getTime() < Date.now();

const formatInr = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;
const scratchpadKey = (userId: string) => `crm:scratchpad:${userId}`;

const EmployeeDashboardPage = () => {
  const currentUser = useAuthStore((s) => s.user);
  const firstName = currentUser?.name?.split(" ")[0] ?? "there";

  const [scratchpadText, setScratchpadText] = useState(() => {
    if (!currentUser?._id) return "";
    try {
      return localStorage.getItem(scratchpadKey(currentUser._id)) ?? "";
    } catch {
      return "";
    }
  });

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!currentUser?._id) return;
    try {
      localStorage.setItem(scratchpadKey(currentUser._id), scratchpadText);
    } catch {
      // localStorage unavailable (private mode, etc.)
    }
  }, [scratchpadText, currentUser?._id]);

  const handleCopyScratchpad = () => {
    if (!scratchpadText) return;
    navigator.clipboard.writeText(scratchpadText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const { data: myLeadsData, isLoading: leadsLoading } = useLeads({
    assignedTo: currentUser?._id,
    limit: 100,
  });
  const myLeads = useMemo(() => myLeadsData?.leads ?? [], [myLeadsData]);
  const leadsTotal = myLeadsData?.pagination.total ?? myLeads.length;
  const newLeadsToday = useMemo(() => {
    const todayStr = new Date().toDateString();
    return myLeads.filter((l) => new Date(l.createdAt).toDateString() === todayStr).length;
  }, [myLeads]);

  const { data: followUps, isLoading: followUpsLoading } = useMyFollowUps();
  const pendingFollowUps = useMemo(
    () =>
      [...(followUps ?? [])].sort(
        (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      ),
    [followUps]
  );
  const overdueFollowUps = useMemo(
    () => pendingFollowUps.filter((f) => isFollowUpOverdue(f.scheduledAt)).length,
    [pendingFollowUps]
  );

  const { data: revenueData, isLoading: revenueLoading } = useRevenueReportQuery({
    viewMode: "INDIVIDUAL",
  });
  const verifiedRevenue = Array.isArray(revenueData?.summary)
    ? (revenueData.summary as RevenueStatusSummary[]).find(
        (s) => s._id === REVENUE_STATUS.VERIFIED
      )?.totalAmount ?? 0
    : 0;

  const pendingRevenue = Array.isArray(revenueData?.summary)
    ? (revenueData.summary as RevenueStatusSummary[]).find(
        (s) => s._id === REVENUE_STATUS.PENDING
      )?.totalAmount ?? 0
    : 0;

  const today = todayInput();

  const { data, isLoading: isAttendanceLoading, isFetching } = useAttendanceRecords({
    date: today,
    employeeId: currentUser?._id,
    page: 1,
    limit: 10,
  });
  const todaysRecord = data?.records.find((r) => r.date === today);

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6 font-sans max-w-7xl mx-auto">
      
      {/* Top Banner Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-indigo-600 font-bold text-xs tracking-wider uppercase bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
            <span className="material-symbols-outlined text-sm">waving_hand</span>
            <span>Agent Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight capitalize">
            Welcome, {firstName}.
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {pendingFollowUps.length > 0
              ? `${pendingFollowUps.length} follow-up${
                  pendingFollowUps.length > 1 ? "s" : ""
                } waiting for you${
                  overdueFollowUps > 0 ? `, ${overdueFollowUps} overdue` : ""
                }.`
              : "No pending follow-ups scheduled for today. You're all caught up!"}
          </p>
        </div>

        <div className="w-full lg:w-auto shrink-0">
          <DailyAttendanceCard
            attendanceData={todaysRecord}
            isAttendanceLoading={isAttendanceLoading || isFetching}
          />
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* My Leads Card */}
        <Link
          to="/leads"
          className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Assigned Leads
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
              <span className="material-symbols-outlined text-xl">group</span>
            </div>
          </div>
          
          <div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {leadsLoading ? "—" : leadsTotal}
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-bold text-sky-700 border border-sky-100">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              <span>{leadsLoading ? "Loading…" : `+${newLeadsToday} New today`}</span>
            </div>
          </div>
        </Link>

        {/* Follow-ups Card */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pending Follow-ups
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <span className="material-symbols-outlined text-xl">calendar_today</span>
            </div>
          </div>

          <div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {followUpsLoading ? "—" : pendingFollowUps.length}
            </div>
            <div className="mt-2">
              {!followUpsLoading && overdueFollowUps > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-200/60">
                  <span className="material-symbols-outlined text-sm">priority_high</span>
                  {overdueFollowUps} Overdue
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200/60">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  {followUpsLoading ? "Loading…" : "On schedule"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* My Revenue Card */}
        <div className="sm:col-span-2 lg:col-span-1 relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Verified Revenue
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <span className="material-symbols-outlined text-xl">payments</span>
            </div>
          </div>

          <div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {revenueLoading ? "—" : formatInr(verifiedRevenue)}
            </div>
            <Link
              to="/revenue"
              className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <span>View Revenue Ledger</span>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </Link>
          </div>
        </div>

      </div>

      {/* Main Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column (2 Spans): Revenue Banner, Follow-ups, Tasks */}
        <div className="lg:col-span-2 space-y-6">

          {/* Revenue Summary Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-7 text-white shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <span className="inline-block text-[10px] font-black uppercase tracking-widest text-indigo-200 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-700/50">
                  Performance Ledger
                </span>
                <h2 className="text-xl font-extrabold tracking-tight">
                  Personal Revenue Snapshot
                </h2>
                <p className="text-xs text-indigo-200/80">
                  Verified conversions vs pending verification
                </p>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {revenueLoading ? "—" : formatInr(verifiedRevenue)}
                </div>
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 sm:justify-end">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Verified Total
                </span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-indigo-700/50 flex items-center justify-between text-xs">
              <span className="font-medium text-indigo-200">Pending Review:</span>
              <span className="font-bold text-amber-300 font-mono text-sm">
                {revenueLoading ? "—" : formatInr(pendingRevenue)}
              </span>
            </div>
          </div>

          {/* Pending Follow-ups List */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <span className="material-symbols-outlined text-lg">edit_calendar</span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Scheduled Follow-ups
                </h3>
              </div>
              <Link
                to="/leads"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                View Leads →
              </Link>
            </div>

            {followUpsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : pendingFollowUps.length === 0 ? (
              <div className="py-8 text-center space-y-1">
                <span className="material-symbols-outlined text-emerald-500 text-3xl">check_circle</span>
                <p className="text-xs font-bold text-slate-700">No scheduled calls</p>
                <p className="text-[11px] text-slate-400">All follow-ups are completed for now.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingFollowUps.slice(0, 6).map((item) => {
                  const lead = typeof item.lead === "string" ? null : item.lead;
                  const overdue = isFollowUpOverdue(item.scheduledAt);

                  return (
                    <div
                      key={item._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 first:pt-1 last:pb-0 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-extrabold text-xs border border-slate-200 uppercase">
                          {lead ? initialsOf(lead.name) : "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                            {lead?.name ?? "Lead Record"}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {lead?.city ?? "General"}
                            {item.remark ? ` • ${item.remark}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                        <div className="text-left sm:text-right">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {overdue ? "Overdue" : "Scheduled"}
                          </span>
                          <span
                            className={`text-xs font-bold font-mono ${
                              overdue ? "text-rose-600" : "text-slate-700"
                            }`}
                          >
                            {new Date(item.scheduledAt).toLocaleString([], {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </span>
                        </div>

                        {lead && (
                          <a
                            href={`tel:${lead.phone}`}
                            className="flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-[0.98] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-all"
                          >
                            <span className="material-symbols-outlined text-sm">call</span>
                            <span>Call</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <TaskOverviewWidget
            title="My Tasks"
            description="Your personal task queue and assigned goals."
          />
        </div>

        {/* Right Column (1 Span): Responsive Notepad & Dialer Shortcut */}
        <div className="space-y-6">

          {/* Optimized Notepad / Scratchpad */}
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-5 shadow-xs space-y-3 relative">
            <div className="flex items-center justify-between border-b border-amber-200/50 pb-2.5">
              <div className="flex items-center gap-2 text-amber-900">
                <span className="material-symbols-outlined text-lg">edit_note</span>
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Quick Scratchpad
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyScratchpad}
                  disabled={!scratchpadText}
                  className="text-[10px] font-bold text-amber-800 hover:text-amber-950 disabled:opacity-40 transition-opacity bg-amber-100/80 px-2 py-0.5 rounded border border-amber-200"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200/60">
                  Autosaved
                </span>
              </div>
            </div>

            <textarea
              rows={5}
              placeholder="Jot down quick client requests, phone numbers, or notes during calls..."
              value={scratchpadText}
              onChange={(e) => setScratchpadText(e.target.value)}
              className="w-full bg-transparent text-xs text-amber-950 placeholder:text-amber-800/40 outline-none resize-y min-h-[100px] leading-relaxed font-mono"
            />

            {scratchpadText && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setScratchpadText("")}
                  className="text-[10px] text-amber-700 hover:text-rose-600 transition-colors"
                >
                  Clear Notes
                </button>
              </div>
            )}
          </div>

          {/* Call Dialer Quick Link */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-3 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <span className="material-symbols-outlined text-lg">history</span>
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Call Logs & History
                </h3>
                <p className="text-[11px] text-slate-400">
                  Review call duration and dialer records
                </p>
              </div>
            </div>

            <Link
              to="/dialer/history"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all"
            >
              <span>Open Call Dialer History</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
};

export default EmployeeDashboardPage;