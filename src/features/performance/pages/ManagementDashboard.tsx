import React, { useMemo, useState } from "react";
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
} from "recharts";
import {
    PhoneCall,
    CheckCircle2,
    Clock,
    Users,
    TrendingUp,
    RefreshCw,
    AlertTriangle,
    PhoneIncoming,
    PhoneMissed,
    UserCheck,
} from "lucide-react";
import { usePerformanceQuery } from "../hooks/usePerformance";
import { useBranchesQuery } from "@/features/branches";
import type { PerformanceQuery } from "@/types/performance";
import { daysAgoInput, todayInput } from "@/utils/Date";
import PerformanceFilters from "../components/PerformanceFilters";
import { useEmployeesQuery } from "@/features/employees";
import { useAuthStore } from "@/store/auth.store";


const DEFAULT_FILTERS: PerformanceQuery = {
    viewMode: "",
    targetUserId: "",
    branchId: "",
    startDate: daysAgoInput(6),
    endDate: todayInput(),
}

// Types corresponding to backend contract
export interface DashboardScope {
    viewMode: "INDIVIDUAL" | "TEAM" | "BRANCH";
    targetUser?: {
        id: string;
        name: string;
        role: string;
    };
    teamSize?: number;
    branchId?: string;
    activeUsersCount?: number;
}

export interface DashboardPeriod {
    startDate: string;
    endDate: string;
}

export interface DashboardMetrics {
    leads: {
        totalAssigned: number;
        statusCounts: Record<string, number>;
    };
    calls: {
        totalCalls: number;
        answeredCalls: number;
        missedCalls: number;
        totalDurationSeconds: number;
        avgDurationSeconds: number;
    };
    tasks: {
        totalTasks: number;
        completedTasks: number;
        pendingTasks: number;
        overdueTasks: number;
    };
    attendance: {
        totalLogs: number;
        daysPresent: number;
        totalLateMinutes: number;
        totalWorkingMinutes: number;
    };
}

export interface ManagementDashboardData {
    scope: DashboardScope;
    period: DashboardPeriod;
    metrics: DashboardMetrics;
}

interface ManagementDashboardProps {
    data?: ManagementDashboardData;
    isLoading?: boolean;
    onRefresh?: () => void;
}

// Color palette generator for dynamic lead statuses
const LEAD_STATUS_COLORS = [
    "#6366F1", // Indigo
    "#0EA5E9", // Sky
    "#10B981", // Emerald
    "#F59E0B", // Amber
    "#EF4444", // Rose
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#64748B", // Slate
];

// Helper: Formatter for working minutes
const formatWorkingMinutes = (minutes: number) => {
    if (!minutes || minutes <= 0) return "0h 0m";
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
};

// Helper: Formatter for seconds
const formatSeconds = (seconds: number) => {
    if (!seconds || seconds <= 0) return "0m 0s";
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
};

// Helper: Formatter for dates
const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

export const ManagementDashboard: React.FC<ManagementDashboardProps> = ({
}) => {
    const user = useAuthStore((s) => s.user)
    const [filters, setFilters] = useState<PerformanceQuery>(DEFAULT_FILTERS);


    // Resolve the viewMode dynamically based on state & user selections
    const resolvedViewMode = (() => {
        if (user?.role === "employee") return "INDIVIDUAL";

        if (user?.role === "manager") {
            // Manager always needs an explicit viewMode (TEAM is the 403-safe
            // default); drilling into a report switches it to INDIVIDUAL.
            return filters.targetUserId ? "INDIVIDUAL" : "TEAM";
        }

        // HEAD / ADMIN: empty viewMode = global. Only send BRANCH/TEAM/INDIVIDUAL
        // when the person explicitly picked one in the filter bar.
        return filters.viewMode || "";
    })();

    const reportQuery: PerformanceQuery = {
        viewMode: resolvedViewMode,
        startDate: filters.startDate ? `${filters.startDate}T00:00:00.000Z` : undefined,
        endDate: filters.endDate ? `${filters.endDate}T23:59:59.999Z` : undefined,
        // Employees never send branch/target — always implicitly "self".
        branchId: user?.role === "employee" ? undefined : (filters.branchId || undefined),
        targetUserId: user?.role === "employee" ? undefined : (filters.targetUserId || undefined),
    };

    const { data, isLoading, refetch } = usePerformanceQuery(reportQuery);
    const { data: branches, isLoading: branchesLoading } = useBranchesQuery();

    const { data: employeesData, isLoading: employeesLoading } = useEmployeesQuery({
        branchId: filters.branchId || undefined,
        limit: 100,
    });


    // Safe default unwrapping
    const scope = data?.scope;
    const period = data?.period;
    const metrics = data?.metrics;

    const onRefresh = () => {
        refetch();
    };

    // Derived Calculations
    const leadsData = useMemo(() => {
        if (!metrics?.leads?.statusCounts) return [];
        return Object.entries(metrics.leads.statusCounts).map(
            ([status, count], index) => ({
                name: status.replace(/_/g, " "),
                value: count,
                color: LEAD_STATUS_COLORS[index % LEAD_STATUS_COLORS.length],
            })
        );
    }, [metrics?.leads?.statusCounts]);

    const wonRate = useMemo(() => {
        const total = metrics?.leads?.totalAssigned || 0;
        if (total <= 0 || !metrics?.leads?.statusCounts) return null;

        // Check if WON status exists case-insensitively
        const wonEntry = Object.entries(metrics.leads.statusCounts).find(
            ([key]) => key.toUpperCase() === "WON"
        );
        return wonEntry ? ((wonEntry[1] / total) * 100).toFixed(1) : null;
    }, [metrics?.leads]);

    const contactRate = useMemo(() => {
        const total = metrics?.leads?.totalAssigned || 0;
        if (total <= 0 || !metrics?.leads?.statusCounts) return null;

        const contactedEntry = Object.entries(metrics.leads.statusCounts).find(
            ([key]) => key.toUpperCase() === "CONTACTED"
        );
        return contactedEntry ? ((contactedEntry[1] / total) * 100).toFixed(1) : null;
    }, [metrics?.leads]);

    const taskCompletionRate = useMemo(() => {
        const total = metrics?.tasks?.totalTasks || 0;
        const completed = metrics?.tasks?.completedTasks || 0;
        if (total <= 0) return 0;
        return Math.round((completed / total) * 100);
    }, [metrics?.tasks]);

    const callAnswerRate = useMemo(() => {
        const total = metrics?.calls?.totalCalls || 0;
        const answered = metrics?.calls?.answeredCalls || 0;
        if (total <= 0) return "0.0";
        return ((answered / total) * 100).toFixed(1);
    }, [metrics?.calls]);

    const avgWorkingTimePerPresentDay = useMemo(() => {
        const days = metrics?.attendance?.daysPresent || 0;
        const totalMins = metrics?.attendance?.totalWorkingMinutes || 0;
        if (days <= 0 || totalMins <= 0) return "0h 0m";
        return formatWorkingMinutes(Math.round(totalMins / days));
    }, [metrics?.attendance]);

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    if (!data || !metrics) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    No Performance Data Available
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                    No analytics records were found for the selected scope and period.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto font-sans p-2 sm:p-4 text-slate-900 dark:text-slate-100">
            {/* 1. HEADER SECTION */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold tracking-tight">Management Dashboard</h1>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {scope?.viewMode} MODE
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span>
                            Period: <strong className="text-slate-700 dark:text-slate-300">{period && formatDate(period.startDate)}</strong> –{" "}
                            <strong className="text-slate-700 dark:text-slate-300">{period && formatDate(period.endDate)}</strong>
                        </span>
                        {scope?.targetUser && (
                            <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <UserCheck className="w-3.5 h-3.5" />
                                    Target: <strong className="text-slate-700 dark:text-slate-300">{scope.targetUser.name}</strong> ({scope.targetUser.role})
                                </span>
                            </>
                        )}
                        {scope?.activeUsersCount !== undefined && (
                            <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5" />
                                    Active Users: <strong className="text-slate-700 dark:text-slate-300">{scope.activeUsersCount}</strong>
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {onRefresh && (
                    <button
                        type="button"
                        onClick={onRefresh}
                        className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                    >
                        <RefreshCw className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                        Refresh
                    </button>
                )}
            </div>

            <PerformanceFilters
                filters={filters}
                onChange={setFilters}
                onReset={() => setFilters(DEFAULT_FILTERS)}
                branches={branches}
                branchesLoading={branchesLoading}
                employees={employeesData?.employees}
                employeesLoading={employeesLoading}
                userRole={user?.role}
                currentUserId={user?._id}
                assignedBranchIds={user?.branches} // ASSUMPTION — confirm field name on the user object
            />

            {/* 2. PRIMARY TOP KPI SECTION */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Leads KPI */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Total Leads
                        </span>
                        <span className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                            <TrendingUp className="w-4 h-4" />
                        </span>
                    </div>
                    <div className="text-2xl font-black">{metrics.leads.totalAssigned}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        {Object.keys(metrics.leads.statusCounts || {}).length} Pipeline Stages Active
                    </div>
                </div>

                {/* Calls KPI */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Total Calls
                        </span>
                        <span className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400">
                            <PhoneCall className="w-4 h-4" />
                        </span>
                    </div>
                    <div className="text-2xl font-black">{metrics.calls.totalCalls}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            {metrics.calls.answeredCalls} Ans
                        </span>
                        <span>•</span>
                        <span className="text-rose-600 dark:text-rose-400 font-medium">
                            {metrics.calls.missedCalls} Missed
                        </span>
                    </div>
                </div>

                {/* Tasks KPI */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Total Tasks
                        </span>
                        <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                        </span>
                    </div>
                    <div className="text-2xl font-black">{metrics.tasks.totalTasks}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <span>{metrics.tasks.completedTasks} Done</span>
                        <span>•</span>
                        <span>{metrics.tasks.pendingTasks} Pend</span>
                        {metrics.tasks.overdueTasks > 0 && (
                            <>
                                <span>•</span>
                                <span className="text-rose-600 dark:text-rose-400 font-bold">
                                    {metrics.tasks.overdueTasks} Overdue
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* Attendance KPI */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Days Present
                        </span>
                        <span className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                            <Clock className="w-4 h-4" />
                        </span>
                    </div>
                    <div className="text-2xl font-black">{metrics.attendance.daysPresent}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                        <span>{formatWorkingMinutes(metrics.attendance.totalWorkingMinutes)} Work</span>
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                            {metrics.attendance.totalLateMinutes}m Late
                        </span>
                    </div>
                </div>
            </div>

            {/* 3. LEADS ANALYTICS */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Lead Status Distribution
                    </h2>
                    <div className="flex items-center gap-3 text-xs">
                        {wonRate !== null && (
                            <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-md font-bold border border-emerald-200 dark:border-emerald-800">
                                Won Rate: {wonRate}%
                            </span>
                        )}
                        {contactRate !== null && (
                            <span className="bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 px-2.5 py-1 rounded-md font-bold border border-sky-200 dark:border-sky-800">
                                Contact Rate: {contactRate}%
                            </span>
                        )}
                    </div>
                </div>

                {leadsData.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400 italic">
                        No status distribution data available.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        {/* Donut Chart */}
                        <div className="h-64 relative flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={leadsData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={65}
                                        outerRadius={90}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {leadsData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => [`${value ?? 0} Leads`, "Count"]} contentStyle={{
                                            backgroundColor: "rgba(15, 23, 42, 0.9)",
                                            borderColor: "#334155",
                                            borderRadius: "8px",
                                            color: "#fff",
                                            fontSize: "12px",
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Stat Overlay */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-2xl font-black">{metrics.leads.totalAssigned}</span>
                                <span className="text-[10px] font-bold uppercase text-slate-400">Total Leads</span>
                            </div>
                        </div>

                        {/* Dynamic Status Legend Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {leadsData.map((item: any) => {
                                const pct =
                                    metrics.leads.totalAssigned > 0
                                        ? ((item.value / metrics.leads.totalAssigned) * 100).toFixed(1)
                                        : "0.0";
                                return (
                                    <div
                                        key={item.name}
                                        className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <span
                                                className="w-3 h-3 rounded-full shrink-0"
                                                style={{ backgroundColor: item.color }}
                                            />
                                            <span className="text-xs font-semibold truncate capitalize">
                                                {item.name}
                                            </span>
                                        </div>
                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            {item.value}{" "}
                                            <span className="text-[10px] font-normal text-slate-400">
                                                ({pct}%)
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* 4. TASKS & ATTENDANCE SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* TASKS ANALYTICS */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3">
                        Task Completion
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                        {/* Visual Radial Completion Ring */}
                        <div className="flex flex-col items-center justify-center p-4">
                            <div className="relative flex items-center justify-center w-36 h-36">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                    <path
                                        className="text-slate-100 dark:text-slate-800"
                                        strokeWidth="3.8"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                    <path
                                        className="text-emerald-500 transition-all duration-500 ease-out"
                                        strokeDasharray={`${taskCompletionRate}, 100`}
                                        strokeWidth="3.8"
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                </svg>
                                <div className="absolute flex flex-col items-center justify-center">
                                    <span className="text-2xl font-black">{taskCompletionRate}%</span>
                                    <span className="text-[10px] text-slate-400 font-medium">
                                        {metrics.tasks.completedTasks} / {metrics.tasks.totalTasks}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Task Breakdown List */}
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                                <span className="text-slate-500 font-medium">Total Assigned</span>
                                <span className="font-bold">{metrics.tasks.totalTasks}</span>
                            </div>
                            <div className="flex justify-between p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300">
                                <span className="font-medium">Completed</span>
                                <span className="font-bold">{metrics.tasks.completedTasks}</span>
                            </div>
                            <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                                <span className="text-slate-500 font-medium">Pending</span>
                                <span className="font-bold">{metrics.tasks.pendingTasks}</span>
                            </div>
                            {/* Actionable Overdue Highlight */}
                            <div
                                className={`flex justify-between p-2 rounded-lg border ${metrics.tasks.overdueTasks > 0
                                    ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 font-bold"
                                    : "bg-slate-50 dark:bg-slate-800/40 text-slate-500 border-transparent"
                                    }`}
                            >
                                <span className="flex items-center gap-1">
                                    {metrics.tasks.overdueTasks > 0 && <AlertTriangle className="w-3.5 h-3.5" />}
                                    Overdue Tasks
                                </span>
                                <span>{metrics.tasks.overdueTasks}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ATTENDANCE ANALYTICS */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3">
                        Attendance & Work Duration
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                                    Days Present
                                </span>
                                <div className="text-xl font-black">{metrics.attendance.daysPresent} Days</div>
                                <span className="text-[11px] text-slate-500 block">
                                    Total Logs: {metrics.attendance.totalLogs}
                                </span>
                            </div>

                            <div className="p-3 rounded-lg border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/20 space-y-1">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-amber-600 dark:text-amber-400">
                                    Total Late Time
                                </span>
                                <div className="text-xl font-black text-amber-700 dark:text-amber-300">
                                    {metrics.attendance.totalLateMinutes} min
                                </div>
                                {metrics.attendance.totalLateMinutes > 60 && (
                                    <span className="text-[11px] text-amber-600/80 dark:text-amber-400/80 block">
                                        ≈ {formatWorkingMinutes(metrics.attendance.totalLateMinutes)} total delay
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between space-y-3">
                            <div className="space-y-1">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                                    Total Working Time
                                </span>
                                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                                    {formatWorkingMinutes(metrics.attendance.totalWorkingMinutes)}
                                </div>
                            </div>

                            <div className="border-t border-slate-200 dark:border-slate-700/60 pt-2 space-y-0.5">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                                    Avg Work / Present Day
                                </span>
                                <div className="text-sm font-bold">{avgWorkingTimePerPresentDay}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. CALL ACTIVITY — NO GRAPHS */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Call Activity Summary
                    </h2>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Factual Summary
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Metrics Table */}
                    <div className="md:col-span-2 overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                                    <th className="py-2 px-3">Call Metric</th>
                                    <th className="py-2 px-3 text-right">Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                <tr>
                                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">Total Calls Logged</td>
                                    <td className="py-2.5 px-3 text-right font-bold">{metrics.calls.totalCalls}</td>
                                </tr>
                                <tr>
                                    <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                        <PhoneIncoming className="w-3.5 h-3.5" /> Answered Calls
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                        {metrics.calls.answeredCalls}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2.5 px-3 text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                                        <PhoneMissed className="w-3.5 h-3.5" /> Missed Calls
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-bold text-rose-600 dark:text-rose-400">
                                        {metrics.calls.missedCalls}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">Answer Rate</td>
                                    <td className="py-2.5 px-3 text-right font-bold text-indigo-600 dark:text-indigo-400">
                                        {callAnswerRate}%
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">Total Duration (Talk Time)</td>
                                    <td className="py-2.5 px-3 text-right font-bold">
                                        {formatSeconds(metrics.calls.totalDurationSeconds)}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">Average Call Duration</td>
                                    <td className="py-2.5 px-3 text-right font-bold">
                                        {formatSeconds(metrics.calls.avgDurationSeconds)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Call Status Compact Card */}
                    <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-4 flex flex-col justify-between space-y-3">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                                Call Breakdown
                            </h3>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Answered</span>
                                    <span className="font-bold">{metrics.calls.answeredCalls}</span>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                                    <span className="font-semibold text-rose-600 dark:text-rose-400">Missed</span>
                                    <span className="font-bold">{metrics.calls.missedCalls}</span>
                                </div>
                            </div>
                        </div>

                        <div className="text-[11px] text-slate-400 italic text-center pt-2 border-t border-slate-200 dark:border-slate-800">
                            Avg call time: {formatSeconds(metrics.calls.avgDurationSeconds)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Skeleton Loading State
const DashboardSkeleton = () => (
    <div className="space-y-6 max-w-7xl mx-auto p-4 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            ))}
        </div>
        <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
    </div>
);

export default ManagementDashboard;