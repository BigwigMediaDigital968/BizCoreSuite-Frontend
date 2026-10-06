import { Link, useLocation } from "react-router";

import { ROUTES } from "@/config/routes";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuthStore } from "@/store/auth.store";
import { useCallStore } from "@/store/call.store";
import { PERMISSIONS, ROLES } from "@/types/auth";
import { DAILY_REPORT_WINDOW_STATE } from "@/types/dailyReport";
import { useReportWindow } from "../hooks/useDailyReports";
import { formatRemaining, useServerNow } from "../utils";

/**
 * Floating reminder for employees while today's report is due. It stays up,
 * with no dismiss button, until the report is submitted or the deadline
 * passes, and it stacks above the active-call bar so neither covers the
 * other. It's hidden on the report pages, which show their own countdown.
 */
const DailyReportReminder = () => {
  const isEmployee = useAuthStore((s) => s.user?.role === ROLES.EMPLOYEE);
  const { hasPermission, isLoading } = usePermissions();
  const enabled =
    isEmployee && !isLoading && hasPermission(PERMISSIONS.DAILY_REPORT_CREATE);

  const { pathname } = useLocation();
  const callState = useCallStore((s) => s.callState);

  const { data: reportWindow } = useReportWindow(enabled);
  const now = useServerNow(reportWindow?.clockOffsetMs);

  if (!enabled || !reportWindow || reportWindow.report) return null;

  const isLate = reportWindow.state === DAILY_REPORT_WINDOW_STATE.LATE;
  const isOpen = reportWindow.state === DAILY_REPORT_WINDOW_STATE.OPEN;
  if (!isOpen && !isLate) return null;

  if (
    pathname === ROUTES.dailyReport ||
    pathname === ROUTES.dailyReportHistory
  ) {
    return null;
  }

  const deadline = new Date(
    isLate ? reportWindow.lateUntil : reportWindow.closesAt
  ).getTime();
  const remaining = deadline - now;
  if (remaining <= 0) return null;

  // Same condition ActiveCallPopup uses to show itself at bottom-6.
  const callBarVisible =
    (callState === "calling" ||
      callState === "ringing" ||
      callState === "active") &&
    !pathname.startsWith("/dialer");

  return (
    <Link
      to={ROUTES.dailyReport}
      role="status"
      aria-label={`${isLate ? "Daily report overdue" : "Daily report submission opened"}. ${formatRemaining(remaining)} left. Open the form.`}
      className={`group fixed right-4 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-full py-2 pl-4 pr-2 shadow-2xl ring-1 transition-all hover:-translate-y-0.5 sm:right-6 animate-in slide-in-from-bottom-4 duration-300 ${
        callBarVisible ? "bottom-28" : "bottom-6"
      } ${
        isLate
          ? "bg-amber-600 text-white ring-amber-700/30"
          : "bg-primary text-on-primary ring-black/10"
      }`}
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
      </span>

      <span className="min-w-0 leading-tight">
        <span className="block truncate font-label-md text-xs font-bold">
          {isLate
            ? "Daily report overdue"
            : "Daily report submission opened"}
        </span>
        <span className="block truncate font-body-sm text-[11px] opacity-85 tabular-nums">
          {isLate
            ? `Marked late · closes in ${formatRemaining(remaining)}`
            : `Due in ${formatRemaining(remaining)}`}
        </span>
      </span>

      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 transition-colors group-hover:bg-white/30"
      >
        <span className="material-symbols-outlined text-xl">add</span>
      </span>
    </Link>
  );
};

export default DailyReportReminder;
