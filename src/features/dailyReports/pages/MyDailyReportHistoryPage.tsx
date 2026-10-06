import { useState } from "react";
import { Link, useNavigate } from "react-router";

import RefreshButton from "@/components/ui/RefreshButton";
import { ROUTES } from "@/config/routes";
import { formatDate } from "@/utils/Date";
import { formatDuration, type DailyReport } from "@/types/dailyReport";
import DailyReportDetailModal from "../components/DailyReportDetailModal";
import DailyReportStatusBadge from "../components/DailyReportStatusBadge";
import Pager from "../components/Pager";
import ReportWindowStatus from "../components/ReportWindowStatus";
import {
  dailyReportKeys,
  useMyDailyReports,
  useReportWindow,
} from "../hooks/useDailyReports";

const PAGE_SIZE = 15;

const MyDailyReportHistoryPage = () => {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<DailyReport | null>(null);

  const navigate = useNavigate();

  const { data, isLoading, isError } = useMyDailyReports(page, PAGE_SIZE);
  const reports = data?.reports ?? [];

  const { data: reportWindow } = useReportWindow();
  const canSubmit = Boolean(reportWindow?.canSubmit);
  const hasTodayReport = Boolean(reportWindow?.report);

  /** Only today's report is editable, and only while the window is open. */
  const isEditable = (report: DailyReport) =>
    canSubmit && report.reportDate === reportWindow?.date;

  const windowAction = canSubmit ? (
    <Link
      to={ROUTES.dailyReport}
      className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 font-label-md text-xs font-bold text-on-primary hover:bg-primary/90 transition-colors"
    >
      <span className="material-symbols-outlined text-base">
        {hasTodayReport ? "edit" : "edit_note"}
      </span>
      {hasTodayReport ? "Edit today's report" : "Fill today's report"}
    </Link>
  ) : null;

  return (
    <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-outline-variant/30 pb-5">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs tracking-wider uppercase mb-1">
            <span className="h-0.5 w-4 bg-primary rounded-full" />
            <span>Daily Report</span>
          </div>
          <h1 className="font-headline-md text-2xl sm:text-3xl font-extrabold text-on-surface">
            My Reports
          </h1>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1 max-w-2xl">
            Your submitted daily reports and any review remarks.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <RefreshButton queryKey={dailyReportKeys.all} />
        </div>
      </div>

      {reportWindow && (
        <ReportWindowStatus window={reportWindow} action={windowAction} />
      )}

      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-low/50 font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant/70">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Calls</th>
                <th className="py-3 px-4 text-right">Answered</th>
                <th className="py-3 px-4 text-right">Conversions</th>
                <th className="py-3 px-4 text-right">Duration</th>
                <th className="py-3 px-4">Work completed</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 font-body-sm text-xs text-on-surface">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="py-3.5 px-4">
                      <div className="h-6 rounded-lg bg-surface-container-high animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={8} className="py-10 px-4 text-center text-on-surface-variant">
                    Failed to load your reports.
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 px-4 text-center text-on-surface-variant">
                    You haven't submitted any daily reports yet.
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr
                    key={report._id}
                    onClick={() => setSelected(report)}
                    className="cursor-pointer hover:bg-surface-container-low/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-label-md font-bold whitespace-nowrap">
                      {formatDate(report.reportDate)}
                    </td>
                    <td className="py-3.5 px-4">
                      <DailyReportStatusBadge report={report} />
                    </td>
                    <td className="py-3.5 px-4 text-right">{report.callsAttended}</td>
                    <td className="py-3.5 px-4 text-right">{report.callsAnswered}</td>
                    <td className="py-3.5 px-4 text-right">{report.conversions}</td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {formatDuration(report.totalCallDurationSeconds)}
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant max-w-[280px] truncate">
                      {report.workCompleted}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isEditable(report) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(ROUTES.dailyReport);
                            }}
                            className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 font-label-sm text-[11px] font-bold text-on-primary hover:bg-primary/90 transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">
                              edit
                            </span>
                            Edit
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(report);
                          }}
                          className="rounded-lg border border-outline-variant/40 px-3 py-1.5 font-label-sm text-[11px] font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pager pagination={data?.pagination} noun="reports" onPageChange={setPage} />
      </div>

      <DailyReportDetailModal
        report={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
};

export default MyDailyReportHistoryPage;
