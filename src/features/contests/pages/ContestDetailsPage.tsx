import { useBranchesQuery } from "@/features/branches";
import { Link, useParams } from "react-router";
import { useContestId, useToggleContestStatus } from "../hooks/useContests";
import { ContestLeaderboard } from "../components/ContestLeaderboard";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS, ROLES } from "@/types/auth";
import { useAuthStore } from "@/store/auth.store";

export const ContestDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const { hasPermission } = usePermissions();
    // Employees see only the contest brief — no leaderboard or branch targeting.
    const isEmployee = useAuthStore((s) => s.user?.role) === ROLES.EMPLOYEE;
    const canUpdate = hasPermission(PERMISSIONS.CONTEST_UPDATE);
    // Employees reach this page from Live Contests, not the full list.
    const backPath = hasPermission(PERMISSIONS.CONTEST_VIEW_ALL) ? "/contests" : "/contests/live";

    // Queries & Mutations
    const { data: contest, isLoading, isError } = useContestId(id??"");
    const { data: branches } = useBranchesQuery();
    const deleteContest = useToggleContestStatus();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse">
                <div className="h-6 w-32 bg-surface-container-high rounded-lg" />
                <div className="h-10 w-2/3 bg-surface-container-high rounded-xl" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-96 bg-surface-container-high rounded-2xl" />
                    <div className="h-96 bg-surface-container-high rounded-2xl" />
                </div>
            </div>
        );
    }

    if (isError || !contest) {
        return (
            <div className="min-h-screen bg-surface p-8 text-center space-y-4 flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-error">error</span>
                <h2 className="text-lg font-bold text-on-surface">Contest Not Found</h2>
                <p className="text-xs text-on-surface-variant max-w-sm">
                    The contest you are looking for does not exist or has been removed.
                </p>
                <Link
                    to={backPath}
                    className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary"
                >
                    Back to Contests
                </Link>
            </div>
        );
    }

    // Determine Status
    const now = new Date();
    const start = new Date(contest.startDate);
    const end = new Date(contest.endDate);
    
    let statusLabel = "Active";
    let statusClass = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";

    if (now < start) {
        statusLabel = "Upcoming";
        statusClass = "bg-amber-500/10 text-amber-600 border-amber-500/20";
    } else if (now > end) {
        statusLabel = "Completed";
        statusClass = "bg-surface-container-highest text-on-surface-variant border-outline-variant/30";
    }

    // Resolve branch names from IDs/Objects
    const branchMap = new Map(branches?.map((b) => [b._id, b.name]));
    const targetBranches = contest.branches.map((b:any) => 
        typeof b === "string" ? branchMap.get(b) || b : b.name
    );


    return (
        <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8 space-y-6">
            
            {/* Top Navigation & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Link
                        to={backPath}
                        className="inline-flex items-center gap-1 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors mb-2"
                    >
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        Back to Contests
                    </Link>
                    <div className="flex items-center gap-3">
                        <h1 className="font-headline-md text-2xl sm:text-3xl font-extrabold text-on-surface">
                            {contest.title}
                        </h1>
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusClass}`}>
                            {statusLabel}
                        </span>
                    </div>
                </div>

                {canUpdate && (
                <div className="flex items-center gap-2">
                    <Link
                        type="button"
                        to={`/contest/${contest._id}/edit`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-2 text-xs font-bold text-on-surface hover:bg-surface-container transition-colors"
                    >
                        <span className="material-symbols-outlined text-base">edit</span>
                        Edit
                    </Link>
                    <button
                        type="button"
                        onClick={()=>{}}
                        disabled={deleteContest.isPending}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-error/10 text-error px-4 py-2 text-xs font-bold hover:bg-error/20 transition-colors disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-base">delete</span>
                        Delete
                    </button>
                </div>
                )}
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Side: Overview & Media (2 Cols) */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Media Card (If exists) */}
                    {contest.media?.url && (
                        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 overflow-hidden shadow-sm">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
                                Contest Media
                            </h3>
                            <div className="relative rounded-xl overflow-hidden bg-surface-container-low max-h-80 flex items-center justify-center">
                                {contest.media.resourceType?.startsWith("video") ? (
                                    <video src={contest.media.url} controls className="max-h-80 w-full object-contain" />
                                ) : contest.media.resourceType?.includes("pdf") ? (
                                    <a
                                        href={contest.media.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-8 flex flex-col items-center gap-2 text-primary hover:underline"
                                    >
                                        <span className="material-symbols-outlined text-4xl">picture_as_pdf</span>
                                        <span className="text-xs font-bold">View PDF Document</span>
                                    </a>
                                ) : (
                                    <img
                                        src={contest.media.url}
                                        alt={contest.title}
                                        className="max-h-80 w-full object-cover rounded-xl"
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Description Card */}
                    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 space-y-3 shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Description & Details
                        </h3>
                        <p className="text-sm text-on-surface whitespace-pre-line leading-relaxed">
                            {contest.description}
                        </p>
                    </div>

                    {/* Contest Results Section (Prepared for Future Data) */}
                    {!isEmployee && (
                    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 space-y-4 shadow-sm">
                        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg text-primary">leaderboard</span>
                                <h3 className="text-sm font-bold text-on-surface">Contest Results & Leaderboard</h3>
                            </div>
                            <span className="text-[11px] font-bold text-on-surface-variant/70 bg-surface-container-high px-2 py-0.5 rounded-md">
                                {statusLabel === "Completed" ? "Final Standings" : "Live Standings"}
                            </span>
                        </div>

                        <ContestLeaderboard contest={contest} />
                    </div>
                    )}

                </div>

                {/* Right Side: Meta Info Sidebar (1 Col) */}
                <div className="space-y-6">

                    {/* Timeline & Schedule */}
                    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 space-y-4 shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Timeline
                        </h3>

                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-base">calendar_today</span>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-on-surface-variant/70">Start Date</p>
                                    <p className="text-xs font-bold text-on-surface">
                                        {new Date(contest.startDate).toLocaleString(undefined, {
                                            dateStyle: "medium",
                                            timeStyle: "short",
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-base">event_busy</span>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-on-surface-variant/70">End Date</p>
                                    <p className="text-xs font-bold text-on-surface">
                                        {new Date(contest.endDate).toLocaleString(undefined, {
                                            dateStyle: "medium",
                                            timeStyle: "short",
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Target Branches */}
                    {!isEmployee && (
                    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 space-y-3 shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Target Branches ({targetBranches.length})
                        </h3>

                        <div className="flex flex-wrap gap-1.5">
                            {targetBranches.map((name:any, idx:any) => (
                                <span
                                    key={idx}
                                    className="px-2.5 py-1 rounded-lg bg-surface-container-low border border-outline-variant/30 text-xs font-medium text-on-surface"
                                >
                                    {name}
                                </span>
                            ))}
                        </div>
                    </div>
                    )}

                </div>

            </div>

        </div>
    );
};

export default ContestDetailsPage;