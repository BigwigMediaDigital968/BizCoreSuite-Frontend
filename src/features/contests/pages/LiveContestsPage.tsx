import { Link } from "react-router";
import { useMyBranchContestsQuery } from "../hooks/useContests";

const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

// Read-only view for users without contest:view-all (employees, managers):
// lists the contests running in their own branch via GET /contest/my-branch.
export const LiveContestsPage = () => {
    const { data: contests, isLoading, isError } = useMyBranchContestsQuery();

    const now = new Date();
    const visible = (contests ?? []).filter(
        (c) => c.isActive && new Date(c.endDate) >= now
    );

    return (
        <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8 space-y-6">
            <div>
                <h1 className="font-headline-md text-2xl sm:text-3xl font-extrabold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-600 text-3xl">military_tech</span>
                    Live Contests
                </h1>
                <p className="text-xs text-on-surface-variant mt-1">
                    Contests currently running in your branch. Open one to see the live leaderboard.
                </p>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-48 rounded-2xl bg-surface-container-high animate-pulse" />
                    ))}
                </div>
            ) : isError ? (
                <div className="py-12 text-center space-y-2 rounded-2xl border border-dashed border-outline-variant/40">
                    <span className="material-symbols-outlined text-3xl text-error">error</span>
                    <p className="text-sm font-bold text-on-surface">Couldn't load contests</p>
                    <p className="text-xs text-on-surface-variant">Please try again later.</p>
                </div>
            ) : visible.length === 0 ? (
                <div className="py-12 text-center space-y-2 rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container-low/40">
                    <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                        <span className="material-symbols-outlined text-2xl">military_tech</span>
                    </div>
                    <p className="text-sm font-bold text-on-surface">No live contests right now</p>
                    <p className="text-xs text-on-surface-variant">
                        New contests for your branch will show up here.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {visible.map((contest) => {
                        const upcoming = new Date(contest.startDate) > now;
                        const isImage =
                            contest.media?.resourceType === "image" ||
                            /\.(jpeg|jpg|png|webp|gif)$/i.test(contest.media?.url ?? "");

                        return (
                            <Link
                                key={contest._id}
                                to={`/contest/${contest._id}`}
                                className="group flex flex-col overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm hover:border-primary/40 hover:shadow-md transition-all"
                            >
                                {contest.media?.url && isImage && (
                                    <div className="h-36 w-full bg-surface-container-high overflow-hidden">
                                        <img
                                            src={contest.media.url}
                                            alt={contest.title}
                                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                )}
                                <div className="flex flex-1 flex-col gap-2 p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="font-label-md text-sm font-bold text-on-surface line-clamp-1">
                                            {contest.title}
                                        </p>
                                        <span
                                            className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                                upcoming
                                                    ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                                    : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                            }`}
                                        >
                                            {upcoming ? "Upcoming" : "Live"}
                                        </span>
                                    </div>
                                    <p className="text-xs text-on-surface-variant line-clamp-3 flex-1">
                                        {contest.description}
                                    </p>
                                    <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20 text-[11px] text-on-surface-variant">
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">calendar_today</span>
                                            {formatDate(contest.startDate)} – {formatDate(contest.endDate)}
                                        </span>
                                        <span className="flex items-center gap-0.5 font-bold text-primary">
                                            View
                                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default LiveContestsPage;
