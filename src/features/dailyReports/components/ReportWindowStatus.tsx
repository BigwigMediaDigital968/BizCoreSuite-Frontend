import { useEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  DAILY_REPORT_WINDOW_STATE,
  type DailyReportWindow,
} from "@/types/dailyReport";
import { dailyReportKeys } from "../hooks/useDailyReports";
import { formatClock, formatRemaining, useServerNow } from "../utils";

const STATE_COPY: Record<
  DailyReportWindow["state"],
  { title: string; icon: string; tone: string }
> = {
  [DAILY_REPORT_WINDOW_STATE.NOT_OPEN]: {
    title: "Not open yet",
    icon: "schedule",
    tone: "border-outline-variant/30 bg-surface-container-low",
  },
  [DAILY_REPORT_WINDOW_STATE.OPEN]: {
    title: "Open for submission",
    icon: "edit_note",
    tone: "border-primary/30 bg-primary/5",
  },
  [DAILY_REPORT_WINDOW_STATE.LATE]: {
    title: "Late submission",
    icon: "assignment_late",
    tone: "border-amber-500/40 bg-amber-500/10",
  },
  [DAILY_REPORT_WINDOW_STATE.CLOSED]: {
    title: "Closed for today",
    icon: "lock",
    tone: "border-outline-variant/30 bg-surface-container-low",
  },
  [DAILY_REPORT_WINDOW_STATE.NON_WORKING_DAY]: {
    title: "Not a working day",
    icon: "event_busy",
    tone: "border-outline-variant/30 bg-surface-container-low",
  },
  [DAILY_REPORT_WINDOW_STATE.ON_LEAVE]: {
    title: "You're on leave today",
    icon: "beach_access",
    tone: "border-outline-variant/30 bg-surface-container-low",
  },
};

/** The instant the current state ends, if it's one that counts down. */
const nextBoundary = (w: DailyReportWindow): string | null => {
  switch (w.state) {
    case DAILY_REPORT_WINDOW_STATE.NOT_OPEN:
      return w.opensAt;
    case DAILY_REPORT_WINDOW_STATE.OPEN:
      return w.closesAt;
    case DAILY_REPORT_WINDOW_STATE.LATE:
      return w.lateUntil;
    default:
      return null;
  }
};

interface ReportWindowStatusProps {
  window: DailyReportWindow;
  /** Optional button/link shown on the right, e.g. "Edit today's report". */
  action?: ReactNode;
}

/**
 * Today's submission window with a live countdown. When the countdown hits
 * zero the window is refetched, so the state (and any edit action) flips
 * without waiting for the next poll.
 */
const ReportWindowStatus = ({ window: w, action }: ReportWindowStatusProps) => {
  const now = useServerNow(w.clockOffsetMs);
  const queryClient = useQueryClient();
  const copy = STATE_COPY[w.state];

  const boundary = nextBoundary(w);
  const remainingMs = boundary ? new Date(boundary).getTime() - now : null;
  const boundaryPassed = remainingMs !== null && remainingMs <= 0;

  useEffect(() => {
    if (boundaryPassed) {
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.window() });
    }
  }, [boundaryPassed, queryClient]);

  let detail: string;
  switch (w.state) {
    case DAILY_REPORT_WINDOW_STATE.NOT_OPEN:
      detail = `Opens at ${formatClock(w.opensAt)}. Your working day ends at ${formatClock(w.closesAt)}.`;
      break;
    case DAILY_REPORT_WINDOW_STATE.OPEN:
      detail = w.report
        ? `Submitted. You can edit it until ${formatClock(w.closesAt)}, or until ${formatClock(w.lateUntil)} (marked late).`
        : `Submit before ${formatClock(w.closesAt)}.`;
      break;
    case DAILY_REPORT_WINDOW_STATE.LATE:
      detail = w.report
        ? `Your working day has ended. You can still edit until ${formatClock(w.lateUntil)}.`
        : `Your working day has ended, so this report will be marked late. Submissions close at ${formatClock(w.lateUntil)}. Stay signed in: you can't sign back in after hours.`;
      break;
    case DAILY_REPORT_WINDOW_STATE.CLOSED:
      detail = `Submissions closed at ${formatClock(w.lateUntil)}.`;
      break;
    default:
      detail = "No report is due today.";
  }

  const timerLabel =
    w.state === DAILY_REPORT_WINDOW_STATE.NOT_OPEN ? "Opens in" : "Time left";

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border px-4 py-3.5 sm:flex-row sm:items-center ${copy.tone}`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="material-symbols-outlined text-2xl text-on-surface-variant">
          {copy.icon}
        </span>
        <div className="min-w-0">
          <p className="font-label-md text-sm font-bold text-on-surface">
            {copy.title}
          </p>
          <p className="font-body-sm text-xs text-on-surface-variant">
            {detail}
          </p>
        </div>
      </div>

      {remainingMs !== null && (
        <div
          className="flex items-center gap-2 self-start rounded-xl bg-surface-container-lowest px-3 py-1.5 shadow-sm sm:self-auto"
          aria-live="off"
        >
          <span className="material-symbols-outlined text-lg text-on-surface-variant">
            timer
          </span>
          <div className="leading-tight">
            <p className="font-label-sm text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
              {timerLabel}
            </p>
            <p className="font-headline-sm text-base font-extrabold tabular-nums text-on-surface">
              {formatRemaining(remainingMs)}
            </p>
          </div>
        </div>
      )}

      {action && <div className="shrink-0 self-start sm:self-auto">{action}</div>}
    </div>
  );
};

export default ReportWindowStatus;
