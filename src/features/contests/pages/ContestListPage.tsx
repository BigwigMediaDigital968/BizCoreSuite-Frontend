import { useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { ROLES } from "@/types/auth";
import { contestKeys, useContestsQuery, useToggleContestStatus } from "../hooks/useContests";
import RefreshButton from "@/components/ui/RefreshButton";
import { Link } from "react-router";
import type { Contest } from "@/types/contest";

const PAGE_SIZE = 10;

const ContestListPage = () => {
    const currentUser = useAuthStore((s) => s.user);
    const isHead = currentUser?.role === ROLES.HEAD;

    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");

    // State for managing the confirmation dialog
    const [pendingToggleContest, setPendingToggleContest] = useState<Contest | null>(null);

    const { data, isLoading, isError, refetch, isFetching } = useContestsQuery({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
    });
    const toggleStatus = useToggleContestStatus();

    const contests = data?.contests ?? [];
    const pagination = data?.pagination;

    const handleConfirmToggle = async () => {
        if (!pendingToggleContest) return;
        await toggleStatus.mutateAsync({
            id: pendingToggleContest._id,
            isActive: !pendingToggleContest.isActive,
        });
        setPendingToggleContest(null);
    };

    return (
        <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-primary font-bold text-xs tracking-wider uppercase mb-1">
                        <span className="h-0.5 w-4 bg-primary rounded-full" />
                        <span>Engagement</span>
                    </div>
                    <h1 className="font-headline-md text-2xl sm:text-3xl font-extrabold text-on-surface">
                        Contests
                    </h1>
                    <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1 max-w-2xl">
                        Launch and manage sales contests across branches.
                    </p>
                </div>

                <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
                    <RefreshButton queryKey={contestKeys.all} />

                    {isHead && (
                        <Link
                            to={"/contest/new"}
                            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-label-md text-xs font-bold text-on-primary shadow-sm hover:bg-primary/90 transition-all shrink-0"
                        >
                            <span className="material-symbols-outlined text-lg">military_tech</span>
                            <span>Launch Contest</span>
                        </Link>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 max-w-md">
                <div className="relative flex-1 items-center rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3.5 py-2.5 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-xl text-on-surface-variant">
                        search
                    </span>
                    <input
                        type="text"
                        placeholder="Search contests..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="w-full bg-transparent pl-8 font-body-md text-on-surface outline-none placeholder:text-on-surface-variant/60 text-xs sm:text-sm"
                    />
                </div>

                <button
                    type="button"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors disabled:opacity-50"
                    title="Refresh contests"
                >
                    <span
                        className={`material-symbols-outlined text-xl ${isFetching ? "animate-spin" : ""
                            }`}
                    >
                        refresh
                    </span>
                </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-lowest shadow-sm">
                {isError ? (
                    <div className="px-6 py-16 text-center">
                        <span className="material-symbols-outlined text-4xl mb-2 text-error">error</span>
                        <p className="font-body-md text-error">
                            Failed to load contests. Only Head and Admin roles can view this page.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-outline-variant/30 bg-surface-container-low/50">
                                    <th className="px-6 py-4 font-label-md text-[11px] uppercase tracking-wider text-on-surface-variant/80">
                                        Contest
                                    </th>
                                    <th className="px-6 py-4 font-label-md text-[11px] uppercase tracking-wider text-on-surface-variant/80">
                                        Branches
                                    </th>
                                    <th className="px-6 py-4 font-label-md text-[11px] uppercase tracking-wider text-on-surface-variant/80">
                                        Duration
                                    </th>
                                    <th className="px-6 py-4 font-label-md text-[11px] uppercase tracking-wider text-on-surface-variant/80">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 font-label-md text-[11px] uppercase tracking-wider text-on-surface-variant/80 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/20">
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            <td colSpan={5} className="px-6 py-4">
                                                <div className="h-9 rounded-lg bg-surface-container-high animate-pulse" />
                                            </td>
                                        </tr>
                                    ))
                                ) : contests.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant">
                                            <span className="material-symbols-outlined text-4xl mb-2 text-outline block">
                                                emoji_events
                                            </span>
                                            <p className="font-body-md">No contests found.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    contests.map((contest) => (
                                        <tr
                                            key={contest._id}
                                            className="hover:bg-surface-container-low/40 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <p className="font-label-md text-on-surface">{contest.title}</p>
                                                <p className="font-body-sm text-xs text-on-surface-variant/80 line-clamp-1">
                                                    {contest.description}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1.5 max-w-55">
                                                    {contest.branches.slice(0, 3).map((b) => (
                                                        <span
                                                            key={typeof b === "string" ? b : b._id}
                                                            className="inline-block rounded-md bg-surface-container-high px-2 py-0.5 font-label-sm text-[10px] font-semibold text-on-surface-variant"
                                                        >
                                                            {typeof b === "string" ? b : b.name}
                                                        </span>
                                                    ))}
                                                    {contest.branches.length > 3 && (
                                                        <span className="inline-block rounded-md bg-surface-container-high px-2 py-0.5 font-label-sm text-[10px] font-semibold text-on-surface-variant">
                                                            +{contest.branches.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-body-sm text-xs text-on-surface-variant">
                                                {new Date(contest.startDate).toLocaleDateString("en-IN")} –{" "}
                                                {new Date(contest.endDate).toLocaleDateString("en-IN")}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-label-sm text-[11px] font-semibold ${contest.isActive
                                                            ? "bg-emerald-500/10 text-emerald-700"
                                                            : "bg-surface-container-high text-on-surface-variant"
                                                        }`}
                                                >
                                                    <span
                                                        className={`h-1.5 w-1.5 rounded-full ${contest.isActive ? "bg-emerald-500" : "bg-outline"
                                                            }`}
                                                    />
                                                    {contest.isActive ? "ACTIVE" : "INACTIVE"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    {/* View Details Action */}
                                                    <Link
                                                        to={`/contest/${contest._id}`}
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                                                        title="View contest details"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">visibility</span>
                                                    </Link>

                                                    {isHead && (
                                                        <>
                                                            <Link
                                                                to={`/contest/${contest._id}/edit`}
                                                                className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                                                                title="Edit contest"
                                                            >
                                                                <span className="material-symbols-outlined text-lg">edit</span>
                                                            </Link>
                                                            {
                                                                (['admin', 'head'].includes(currentUser.role)) && (
                                                                    <button
                                                                onClick={() => setPendingToggleContest(contest)}
                                                                disabled={toggleStatus.isPending}
                                                                className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors disabled:opacity-40"
                                                                title={contest.isActive ? "Deactivate" : "Activate"}
                                                            >
                                                                <span className="material-symbols-outlined text-lg">
                                                                    {contest.isActive ? "toggle_off" : "toggle_on"}
                                                                </span>
                                                            </button>
                                                                )
                                                            }
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-outline-variant/30 px-6 py-4 bg-surface-container-lowest">
                        <p className="font-body-sm text-xs text-on-surface-variant">
                            Page <span className="font-medium text-on-surface">{pagination.page}</span> of{" "}
                            <span className="font-medium text-on-surface">{pagination.totalPages}</span>
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                disabled={pagination.page <= 1}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container disabled:opacity-40 transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">chevron_left</span>
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
                                disabled={pagination.page >= pagination.totalPages}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container disabled:opacity-40 transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">chevron_right</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Status Change Confirmation Dialog */}
            {pendingToggleContest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-surface-container-lowest p-6 shadow-xl border border-outline-variant/30 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${pendingToggleContest.isActive ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"
                                }`}>
                                <span className="material-symbols-outlined text-xl">
                                    {pendingToggleContest.isActive ? "pause_circle" : "play_circle"}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-on-surface">
                                    {pendingToggleContest.isActive ? "Deactivate Contest?" : "Activate Contest?"}
                                </h3>
                                <p className="text-xs text-on-surface-variant line-clamp-1">
                                    {pendingToggleContest.title}
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-on-surface-variant leading-relaxed">
                            {pendingToggleContest.isActive
                                ? "Deactivating this contest will temporarily hide or suspend active participation across branches."
                                : "Activating this contest will make it live for users in target branches."}
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
                            <button
                                type="button"
                                onClick={() => setPendingToggleContest(null)}
                                className="rounded-xl px-3.5 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmToggle}
                                disabled={toggleStatus.isPending}
                                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary hover:bg-primary/90 disabled:opacity-50 transition-colors"
                            >
                                {toggleStatus.isPending ? "Updating…" : "Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContestListPage;