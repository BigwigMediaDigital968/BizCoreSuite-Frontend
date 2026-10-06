import { useState } from "react";
import toast from "react-hot-toast";

import { Can } from "@/components/Auth/Can";
import { PERMISSIONS } from "@/types/auth";
import { daysAgoInput, formatDate, todayInput } from "@/utils/Date";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { dailyReportApi } from "@/services/dailyReportApi";
import {
  formatDuration,
  hasMetricMismatch,
  refName,
  type DailyReport,
  type DailyReportExportFormat,
} from "@/types/dailyReport";
import DailyReportDetailModal from "./DailyReportDetailModal";
import DailyReportStatusBadge from "./DailyReportStatusBadge";
import Pager from "./Pager";
import {
  BranchSelect,
  DateRange,
  ToggleChip,
} from "./ReportFilterControls";
import { useDailyReports } from "../hooks/useDailyReports";
import { filterControlClass as controlClass, formatClock } from "../utils";

const PAGE_SIZE = 20;

const SubmittedReportsTab = () => {
  const [range, setRange] = useState({
    startDate: daysAgoInput(6),
    endDate: todayInput(),
  });
  const [branchId, setBranchId] = useState("");
  const [lateOnly, setLateOnly] = useState(false);
  const [mismatchOnly, setMismatchOnly] = useState(false);
  const [unreviewedOnly, setUnreviewedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<DailyReport | null>(null);
  const [exportFormat, setExportFormat] =
    useState<DailyReportExportFormat>("csv");
  const [isExporting, setIsExporting] = useState(false);

  const filters = {
    ...range,
    branchId: branchId || undefined,
    lateOnly: lateOnly || undefined,
    mismatchOnly: mismatchOnly || undefined,
    reviewed: unreviewedOnly ? false : undefined,
  };

  const { data, isLoading, isError } = useDailyReports({
    ...filters,
    page,
    limit: PAGE_SIZE,
  });
  const reports = data?.reports ?? [];

  // Any filter change goes back to page 1.
  const withReset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { blob, filename } = await dailyReportApi.exportReports(
        filters,
        exportFormat
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Reports downloaded");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to export reports"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <DateRange
          startDate={range.startDate}
          endDate={range.endDate}
          onChange={withReset(setRange)}
        />
        <BranchSelect value={branchId} onChange={withReset(setBranchId)} />
        <ToggleChip
          label="Late"
          active={lateOnly}
          onToggle={() => withReset(setLateOnly)(!lateOnly)}
        />
        <ToggleChip
          label="Differs from system"
          active={mismatchOnly}
          onToggle={() => withReset(setMismatchOnly)(!mismatchOnly)}
        />
        <ToggleChip
          label="Not reviewed"
          active={unreviewedOnly}
          onToggle={() => withReset(setUnreviewedOnly)(!unreviewedOnly)}
        />

        <Can permission={PERMISSIONS.DAILY_REPORT_EXPORT}>
          <div className="ml-auto flex items-center gap-1.5">
            <select
              value={exportFormat}
              onChange={(e) =>
                setExportFormat(e.target.value as DailyReportExportFormat)
              }
              aria-label="Export format"
              className={controlClass}
            >
              <option value="csv">CSV</option>
              <option value="excel">Excel</option>
            </select>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-1.5 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-2 font-label-md text-xs font-bold text-on-surface hover:bg-surface-container disabled:opacity-50 transition-colors"
            >
              <span className="material-symbols-outlined text-base">
                download
              </span>
              {isExporting ? "Exporting…" : "Export"}
            </button>
          </div>
        </Can>
      </div>

      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-low/50 font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant/70">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Calls</th>
                <th className="py-3 px-4 text-right">Answered</th>
                <th className="py-3 px-4 text-right">Conversions</th>
                <th className="py-3 px-4 text-right">Duration</th>
                <th className="py-3 px-4">Work completed</th>
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
                    Failed to load daily reports.
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 px-4 text-center text-on-surface-variant">
                    No reports match these filters.
                  </td>
                </tr>
              ) : (
                reports.map((report) => {
                  const mismatch = hasMetricMismatch(report);
                  return (
                    <tr
                      key={report._id}
                      onClick={() => setSelected(report)}
                      className="cursor-pointer hover:bg-surface-container-low/30 transition-colors align-top"
                    >
                      <td className="py-3.5 px-4">
                        <p className="font-label-md font-bold">
                          {refName(report.employeeId)}
                        </p>
                        <p className="text-[11px] text-on-surface-variant/70">
                          {refName(report.branchId)}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {formatDate(report.reportDate)}
                        <p className="text-[11px] text-on-surface-variant/70">
                          at {formatClock(report.submittedAt)}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <DailyReportStatusBadge report={report} />
                        {mismatch && (
                          <p
                            className="mt-1 flex items-center gap-1 text-[10px] font-bold text-amber-700"
                            title="Reported figures differ from the dialer/revenue records"
                          >
                            <span className="material-symbols-outlined text-xs">
                              warning
                            </span>
                            Differs from system
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">{report.callsAttended}</td>
                      <td className="py-3.5 px-4 text-right">{report.callsAnswered}</td>
                      <td className="py-3.5 px-4 text-right">{report.conversions}</td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {formatDuration(report.totalCallDurationSeconds)}
                      </td>
                      <td className="py-3.5 px-4 text-on-surface-variant max-w-[240px] truncate">
                        {report.workCompleted}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pager pagination={data?.pagination} noun="reports" onPageChange={setPage} />
      </div>

      <DailyReportDetailModal
        report={selected}
        onClose={() => setSelected(null)}
        showReview
      />
    </div>
  );
};

export default SubmittedReportsTab;
