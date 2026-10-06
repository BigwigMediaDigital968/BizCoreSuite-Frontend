import { useMyBranchContestsQuery } from "../hooks/useContests";

const MyBranchContests = () => {
    const { data: contests, isLoading } = useMyBranchContestsQuery();

    if (isLoading) {
        return (
            <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-16 rounded-xl bg-surface-container-high animate-pulse" />
                ))}
            </div>
        );
    }

    if (!contests || contests.length === 0) return null;

    return (
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm space-y-4">
            <h3 className="font-headline-sm text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600">military_tech</span>
                Active Contests
            </h3>
            <div className="space-y-3">
                {contests.map((contest) => (
                    <div
                        key={contest._id}
                        className="rounded-xl border border-outline-variant/30 bg-surface-container-low/40 p-3.5 space-y-1.5"
                    >
                        <p className="font-label-md text-sm font-bold text-on-surface">{contest.title}</p>
                        <p className="font-body-sm text-xs text-on-surface-variant line-clamp-2">
                            {contest.description}
                        </p>
                        <p className="font-body-sm text-[11px] text-on-surface-variant/70">
                            Ends{" "}
                            {new Date(contest.endDate).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                            })}
                        </p>
                        {contest.media?.url && (
                            <a
                                href={contest.media.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-label-sm text-[11px] font-bold text-primary hover:underline"
                            >
                                <span className="material-symbols-outlined text-sm">visibility</span>
                                View details
                            </a>
                        )}
                    </div>
                ))}
            </div>
        </div >
    );
};

export default MyBranchContests;