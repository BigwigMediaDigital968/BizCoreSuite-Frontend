import { useMemo } from "react";
import { useRevenueReportQuery } from "@/features/revenue/hooks/useRevenue";
import type { Contest } from "@/types/contest";

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);

const MEDAL_CLASSES = [
    "bg-amber-400/15 text-amber-600 border-amber-400/40",
    "bg-slate-400/15 text-slate-500 border-slate-400/40",
    "bg-orange-400/15 text-orange-600 border-orange-400/40",
];

interface LeaderboardRow {
    employeeId: string;
    name: string;
    branchName: string;
    verified: number;
    pending: number;
    entries: number;
}

interface ContestLeaderboardProps {
    contest: Contest;
}

export const ContestLeaderboard = ({ contest }: ContestLeaderboardProps) => {
    const hasStarted = new Date() >= new Date(contest.startDate);

    const targetBranchIds = useMemo(
        () =>
            new Set(
                contest.branches.map((b) => (typeof b === "string" ? b : b._id))
            ),
        [contest.branches]
    );

    // "ALL" = everything the viewer may see; narrowed to the contest's
    // target branches client-side so it works for Admins whose branch set
    // differs from the contest's (BRANCH mode would 403 on those).
    const { data, isLoading, isError } = useRevenueReportQuery(
        {
            viewMode: "ALL",
            startDate: new Date(contest.startDate).toISOString(),
            endDate: new Date(contest.endDate).toISOString(),
        },
        { enabled: hasStarted }
    );

    const rows = useMemo<LeaderboardRow[]>(() => {
        const byEmployee = new Map<string, LeaderboardRow>();

        for (const record of data?.records ?? []) {
            if (record.status === "REJECTED") continue;
            if (!record.employee || !targetBranchIds.has(record.branch?._id)) continue;

            const row = byEmployee.get(record.employee._id) ?? {
                employeeId: record.employee._id,
                name: record.employee.name,
                branchName: record.branch.name,
                verified: 0,
                pending: 0,
                entries: 0,
            };

            if (record.status === "VERIFIED") row.verified += record.amount;
            else row.pending += record.amount;
            row.entries += 1;

            byEmployee.set(row.employeeId, row);
        }

        // Only verified revenue counts toward the rank; pending breaks ties
        return [...byEmployee.values()].sort(
            (a, b) => b.verified - a.verified || b.pending - a.pending
        );
    }, [data, targetBranchIds]);

    const totalVerified = rows.reduce((sum, r) => sum + r.verified, 0);
    const topAmount = rows[0]?.verified ?? 0;

    const emptyState = (icon: string, title: string, message: string) => (
        <div className="py-8 text-center space-y-2 bg-surface-container-low/40 rounded-xl border border-dashed border-outline-variant/40">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-xl">{icon}</span>
            </div>
            <h4 className="text-xs font-bold text-on-surface">{title}</h4>
            <p className="text-[11px] text-on-surface-variant max-w-xs mx-auto">{message}</p>
        </div>
    );

    if (!hasStarted) {
        return emptyState(
            "schedule",
            "Contest Hasn't Started",
            `Standings will appear here once the contest begins on ${new Date(
                contest.startDate
            ).toLocaleDateString(undefined, { dateStyle: "medium" })}.`
        );
    }

    if (isLoading) {
        return (
            <div className="space-y-2 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-14 bg-surface-container-high rounded-xl" />
                ))}
            </div>
        );
    }

    if (isError) {
        return emptyState(
            "error",
            "Couldn't Load Standings",
            "Revenue data for this contest could not be loaded. Please try again later."
        );
    }

    if (rows.length === 0) {
        return emptyState(
            "military_tech",
            "No Leaderboard Data Yet",
            "Results will automatically update here as revenue entries are logged in the target branches."
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-on-surface-variant">
                <span>
                    <span className="font-bold text-on-surface">{rows.length}</span> participants ·
                    Total verified{" "}
                    <span className="font-bold text-on-surface">{formatCurrency(totalVerified)}</span>
                </span>
                <span>Ranked by verified revenue</span>
            </div>

            <ol className="space-y-2">
                {rows.map((row, idx) => {
                    const rank = idx + 1;
                    const share = topAmount > 0 ? (row.verified / topAmount) * 100 : 0;

                    return (
                        <li
                            key={row.employeeId}
                            className={`flex items-center gap-3 rounded-xl border p-3 ${
                                rank <= 3
                                    ? "border-primary/20 bg-primary/5"
                                    : "border-outline-variant/30 bg-surface-container-low/40"
                            }`}
                        >
                            <div
                                className={`h-8 w-8 shrink-0 rounded-full border flex items-center justify-center text-xs font-extrabold ${
                                    MEDAL_CLASSES[idx] ??
                                    "bg-surface-container-high text-on-surface-variant border-outline-variant/30"
                                }`}
                            >
                                {rank <= 3 ? (
                                    <span className="material-symbols-outlined text-base">
                                        {rank === 1 ? "trophy" : "military_tech"}
                                    </span>
                                ) : (
                                    rank
                                )}
                            </div>

                            <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-baseline justify-between gap-2">
                                    <p className="truncate text-sm font-bold text-on-surface">
                                        {row.name}
                                    </p>
                                    <p className="shrink-0 text-sm font-extrabold text-on-surface">
                                        {formatCurrency(row.verified)}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between gap-2 text-[11px] text-on-surface-variant">
                                    <span className="truncate">
                                        {row.branchName} · {row.entries}{" "}
                                        {row.entries === 1 ? "entry" : "entries"}
                                    </span>
                                    {row.pending > 0 && (
                                        <span className="shrink-0 text-amber-600">
                                            +{formatCurrency(row.pending)} pending
                                        </span>
                                    )}
                                </div>
                                <div className="h-1 w-full rounded-full bg-surface-container-high overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-primary"
                                        style={{ width: `${share}%` }}
                                    />
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
};

export default ContestLeaderboard;
