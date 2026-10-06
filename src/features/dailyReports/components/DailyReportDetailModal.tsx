import { useState, type ReactNode } from "react";

import Modal from "@/components/ui/Modal";
import { Can } from "@/components/Auth/Can";
import { PERMISSIONS } from "@/types/auth";
import { formatDate } from "@/utils/Date";
import {
  METRIC_FIELDS,
  formatMetric,
  isMetricMismatch,
  refName,
  type DailyReport,
} from "@/types/dailyReport";
import DailyReportStatusBadge from "./DailyReportStatusBadge";
import { useReviewDailyReport } from "../hooks/useDailyReports";
import { formatDateTime } from "../utils";

interface DailyReportDetailModalProps {
  report: DailyReport | null;
  onClose: () => void;
  /** Management view: shows the employee and the review action. */
  showReview?: boolean;
}

const Section = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <div className="space-y-1.5">
    <p className="font-label-sm text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
      {title}
    </p>
    {children}
  </div>
);

const DailyReportDetailModal = ({
  report,
  onClose,
  showReview = false,
}: DailyReportDetailModalProps) => {
  const [remark, setRemark] = useState("");
  const reviewReport = useReviewDailyReport();

  const close = () => {
    setRemark("");
    onClose();
  };

  if (!report) return null;

  const handleReview = async () => {
    try {
      await reviewReport.mutateAsync({ id: report._id, remark: remark.trim() });
      close();
    } catch {
      // Surfaced by the mutation's error toast.
    }
  };

  const reviewed = Boolean(report.review?.reviewedAt);

  return (
    <Modal
      open
      onClose={close}
      size="lg"
      title={
        showReview
          ? `${refName(report.employeeId)} · ${formatDate(report.reportDate)}`
          : `Daily report · ${formatDate(report.reportDate)}`
      }
      description={`${refName(report.branchId) !== "—" ? `${refName(report.branchId)} · ` : ""}Submitted ${formatDateTime(report.submittedAt)}${report.editCount ? ` · edited ${report.editCount}×` : ""}`}
    >
      <div className="space-y-5">
        <DailyReportStatusBadge report={report} />

        <Section title="Work completed">
          <p className="whitespace-pre-wrap font-body-sm text-sm text-on-surface">
            {report.workCompleted}
          </p>
        </Section>

        <Section title="Activity">
          <div className="overflow-x-auto rounded-xl border border-outline-variant/30">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-surface-container-low/50 font-label-sm text-[10px] uppercase tracking-wider text-on-surface-variant/70">
                  <th className="py-2 px-3">Metric</th>
                  <th className="py-2 px-3 text-right">Reported</th>
                  <th className="py-2 px-3 text-right">System</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {METRIC_FIELDS.map(({ key, label }) => {
                  const system = report.systemMetrics?.[key] ?? 0;
                  const differs = isMetricMismatch(key, report[key], system);
                  return (
                    <tr key={key}>
                      <td className="py-2 px-3 text-on-surface-variant">
                        {label}
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-bold ${differs ? "text-amber-700" : "text-on-surface"}`}
                      >
                        {formatMetric(key, report[key])}
                        {differs && (
                          <span
                            className="material-symbols-outlined ml-1 align-middle text-sm"
                            title="Differs from what the system recorded"
                          >
                            warning
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right text-on-surface-variant">
                        {formatMetric(key, system)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>

        {report.dailyFeedback && (
          <Section title="Daily feedback">
            <p className="whitespace-pre-wrap font-body-sm text-sm text-on-surface">
              {report.dailyFeedback}
            </p>
          </Section>
        )}

        {report.customFields?.length > 0 && (
          <Section title="Additional fields">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              {report.customFields.map((field) => (
                <div
                  key={field.label}
                  className="rounded-xl bg-surface-container-low px-3 py-2"
                >
                  <dt className="font-label-sm text-[11px] text-on-surface-variant">
                    {field.label}
                  </dt>
                  <dd className="font-body-sm text-sm text-on-surface break-words">
                    {field.value || "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </Section>
        )}

        {reviewed ? (
          <Section title="Review">
            <p className="font-body-sm text-xs text-on-surface-variant">
              Reviewed by{" "}
              <span className="font-bold text-on-surface">
                {refName(report.review?.reviewedBy)}
              </span>{" "}
              on {formatDateTime(report.review!.reviewedAt!)}
            </p>
            {report.review?.remark && (
              <p className="whitespace-pre-wrap rounded-xl bg-surface-container-low px-3 py-2 font-body-sm text-sm text-on-surface">
                {report.review.remark}
              </p>
            )}
          </Section>
        ) : (
          showReview && (
            <Can permission={PERMISSIONS.DAILY_REPORT_REVIEW}>
              <Section title="Review">
                <textarea
                  rows={2}
                  maxLength={1000}
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="Optional remark for the employee"
                  className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary resize-none"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleReview}
                    disabled={reviewReport.isPending}
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 font-label-md text-xs font-bold text-on-primary hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">
                      done_all
                    </span>
                    {reviewReport.isPending ? "Saving…" : "Mark as reviewed"}
                  </button>
                </div>
              </Section>
            </Can>
          )
        )}
      </div>
    </Modal>
  );
};

export default DailyReportDetailModal;
