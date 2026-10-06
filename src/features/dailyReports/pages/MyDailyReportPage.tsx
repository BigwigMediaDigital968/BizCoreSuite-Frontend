import { Link, useNavigate } from "react-router";

import RefreshButton from "@/components/ui/RefreshButton";
import { ROUTES } from "@/config/routes";
import { useAuthStore } from "@/store/auth.store";
import { formatDate } from "@/utils/Date";
import {
  DAILY_REPORT_WINDOW_STATE,
  type SubmitDailyReportPayload,
} from "@/types/dailyReport";
import DailyReportForm from "../components/DailyReportForm";
import DailyReportStatusBadge from "../components/DailyReportStatusBadge";
import ReportWindowStatus from "../components/ReportWindowStatus";
import {
  dailyReportKeys,
  useReportWindow,
  useSubmitDailyReport,
} from "../hooks/useDailyReports";
import { clearDraft, draftStorageKey, formatDateTime } from "../utils";

const MyDailyReportPage = () => {
  const userId = useAuthStore((s) => s.user?._id) ?? "";
  const { data: reportWindow, isLoading, isError } = useReportWindow();
  const submitReport = useSubmitDailyReport();
  const navigate = useNavigate();

  const header = (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-outline-variant/30 pb-5">
      <div>
        <div className="flex items-center gap-2 text-primary font-bold text-xs tracking-wider uppercase mb-1">
          <span className="h-0.5 w-4 bg-primary rounded-full" />
          <span>Daily Report</span>
        </div>
        <h1 className="font-headline-md text-2xl sm:text-3xl font-extrabold text-on-surface">
          {reportWindow ? formatDate(reportWindow.date) : "Today's Report"}
        </h1>
        <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1 max-w-2xl">
          Record today's work, calls and conversions before your day ends.
        </p>
      </div>
      <div className="flex items-center gap-2 self-start md:self-auto">
        <Link
          to={ROUTES.dailyReportHistory}
          className="flex items-center gap-1.5 rounded-xl border border-outline-variant/40 px-4 py-2.5 font-label-md text-xs font-bold text-on-surface hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-base">history</span>
          My reports
        </Link>
        <RefreshButton queryKey={dailyReportKeys.window()} />
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8 space-y-6">
        {header}
        <div className="h-16 rounded-2xl bg-surface-container-high animate-pulse" />
        <div className="h-96 rounded-2xl bg-surface-container-high animate-pulse" />
      </div>
    );
  }

  if (isError || !reportWindow) {
    return (
      <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8 space-y-6">
        {header}
        <p className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-10 text-center text-sm text-on-surface-variant">
          Couldn't load today's report. Check that you're assigned to a branch,
          then refresh.
        </p>
      </div>
    );
  }

  const { report, systemMetrics, canSubmit, state } = reportWindow;
  const draftKey = draftStorageKey(userId, reportWindow.date);
  const showForm =
    Boolean(report) ||
    state === DAILY_REPORT_WINDOW_STATE.NOT_OPEN ||
    state === DAILY_REPORT_WINDOW_STATE.OPEN ||
    state === DAILY_REPORT_WINDOW_STATE.LATE;

  const handleSubmit = async (payload: SubmitDailyReportPayload) => {
    try {
      await submitReport.mutateAsync(payload);
      clearDraft(draftKey);
      navigate(ROUTES.dailyReportHistory);
    } catch {
      // Surfaced by the mutation's error toast; the draft is kept.
    }
  };

  return (
    <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8 space-y-6">
      {header}

      <ReportWindowStatus window={reportWindow} />

      {showForm ? (
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 sm:p-6 shadow-sm space-y-5">
          {report && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-container-low px-4 py-2.5">
              <p className="font-body-sm text-xs text-on-surface-variant">
                Submitted {formatDateTime(report.submittedAt)}
                {canSubmit && " · you can edit it until the window closes"}
              </p>
              <DailyReportStatusBadge report={report} />
            </div>
          )}

          {!report && state === DAILY_REPORT_WINDOW_STATE.NOT_OPEN && (
            <p className="font-body-sm text-xs text-on-surface-variant">
              Preview: today's figures so far. The form unlocks when the
              window opens.
            </p>
          )}

          <DailyReportForm
            // Remount when the saved report changes or the window opens, so
            // the form picks up fresh figures (unsent edits live in the draft).
            key={`${reportWindow.date}:${report?.updatedAt ?? "new"}:${canSubmit}`}
            report={report}
            systemMetrics={systemMetrics}
            draftKey={draftKey}
            disabled={!canSubmit}
            isSubmitting={submitReport.isPending}
            onSubmit={handleSubmit}
          />

          {report?.review?.reviewedAt && (
            <p className="rounded-xl bg-primary/5 px-4 py-3 font-body-sm text-xs text-on-surface-variant">
              This report has been reviewed and can no longer be edited.
              {report.review.remark && (
                <span className="mt-1 block text-on-surface">
                  "{report.review.remark}"
                </span>
              )}
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-12 text-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/50">
            assignment
          </span>
          <p className="mt-2 font-body-md text-sm text-on-surface-variant">
            {state === DAILY_REPORT_WINDOW_STATE.CLOSED
              ? "No report was submitted today."
              : "Nothing to submit today."}
          </p>
        </div>
      )}
    </div>
  );
};

export default MyDailyReportPage;
