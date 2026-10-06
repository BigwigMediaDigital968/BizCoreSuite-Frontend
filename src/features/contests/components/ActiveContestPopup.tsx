import { useState, useEffect } from "react";
import { useMyBranchContestsQuery } from "../hooks/useContests";
import { useAuthStore } from "@/store/auth.store";

export const ActiveContestPopup = () => {
  const user = useAuthStore((state) => state.user);
  const { data: contests, isLoading } = useMyBranchContestsQuery();

  const [activeContest, setActiveContest] = useState<any | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isLoading || !Array.isArray(contests) || contests.length === 0) return;

    // Check if user already dismissed the modal during this session
    const isDismissed = sessionStorage.getItem("dismissed_contest_popup");
    if (isDismissed) return;

    // Pick the first active contest returned for this branch
    const matched = contests.find((c) => c.isActive);

    if (matched) {
      setActiveContest(matched);
      setIsOpen(true);
    }
  }, [contests, isLoading]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem("dismissed_contest_popup", "true");
  };

  if(user?.role === 'head') return null;

  if (!isOpen || !activeContest) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          title="Close notification"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Header Badge & Title */}
        <div className="flex items-center gap-3 pr-6">
          <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">military_tech</span>
          </div>
          <div>
            <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 uppercase tracking-wide">
              Active Branch Contest
            </span>
            <h3 className="text-base font-bold text-slate-900 line-clamp-1 mt-0.5">
              {activeContest.title}
            </h3>
          </div>
        </div>

        {/* Media / Image Container */}
        {activeContest.media?.url && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
            {activeContest.media.resourceType?.startsWith("image") ||
            activeContest.media.url.match(/\.(jpeg|jpg|png|webp|gif)$/i) ? (
              <div className="relative h-40 w-full rounded-lg overflow-hidden bg-slate-200">
                <img
                  src={activeContest.media.url}
                  alt={activeContest.media.originalName || activeContest.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 p-1">
                <div className="h-9 w-9 rounded-lg bg-white text-slate-600 shrink-0 flex items-center justify-center border border-slate-200">
                  <span className="material-symbols-outlined text-lg">
                    {activeContest.media.resourceType?.startsWith("video") ||
                    activeContest.media.url.match(/\.(mp4|webm)$/i)
                      ? "movie"
                      : "description"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {activeContest.media.originalName ?? "Attached Media"}
                  </p>
                </div>
                <a
                  href={activeContest.media.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline shrink-0"
                >
                  <span>View</span>
                  <span className="material-symbols-outlined text-xs">open_in_new</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
          {activeContest.description}
        </p>

        {/* Contest Duration */}
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
          <span className="material-symbols-outlined text-base text-slate-400">calendar_today</span>
          <span>
            {new Date(activeContest.startDate).toLocaleDateString("en-IN")} –{" "}
            {new Date(activeContest.endDate).toLocaleDateString("en-IN")}
          </span>
        </div>

        {/* Footer Actions */}
        {/* <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Dismiss
          </button>
          <Link
            to={`/contest/${activeContest._id}`}
            onClick={handleClose}
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs"
          >
            View Details
          </Link>
        </div> */}
      </div>
    </div>
  );
};