import { useState } from "react";

import { daysAgoInput, todayInput } from "@/utils/Date";
import { formatDuration } from "@/types/dailyReport";
import { BranchSelect, DateRange } from "./ReportFilterControls";
import { useDailyReportSummary } from "../hooks/useDailyReports";

const SummaryTab = () => {
  const [range, setRange] = useState({
    startDate: daysAgoInput(29),
    endDate: todayInput(),
  });
  const [branchId, setBranchId] = useState("");

  const { data, isLoading, isError } = useDailyReportSummary(
    range.startDate,
    range.endDate,
    branchId || undefined
  );
  const rows = data?.rows ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <DateRange
          startDate={range.startDate}
          endDate={range.endDate}
          onChange={setRange}
        />
        <BranchSelect value={branchId} onChange={setBranchId} />
      </div>

      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-low/50 font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant/70">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4 text-right">Reports</th>
                <th className="py-3 px-4 text-right">Late</th>
                <th className="py-3 px-4 text-right">Calls</th>
                <th className="py-3 px-4 text-right">Answered</th>
                <th className="py-3 px-4 text-right">Conversions</th>
                <th className="py-3 px-4 text-right">Duration</th>
                <th className="py-3 px-4 text-right">System calls / conv.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 font-body-sm text-xs text-on-surface">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="py-3.5 px-4">
                      <div className="h-6 rounded-lg bg-surface-container-high animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={8} className="py-10 px-4 text-center text-on-surface-variant">
                    Failed to load the summary.
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 px-4 text-center text-on-surface-variant">
                    No reports in this period.
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={row.employee?._id ?? i}>
                    <td className="py-3.5 px-4">
                      <p className="font-label-md font-bold">
                        {row.employee?.name ?? "Unknown"}
                      </p>
                      <p className="text-[11px] text-on-surface-variant/70">
                        {row.branch?.name ?? ""}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-right">{row.reports}</td>
                    <td
                      className={`py-3.5 px-4 text-right ${row.lateReports ? "font-bold text-amber-700" : ""}`}
                    >
                      {row.lateReports}
                    </td>
                    <td className="py-3.5 px-4 text-right">{row.callsAttended}</td>
                    <td className="py-3.5 px-4 text-right">{row.callsAnswered}</td>
                    <td className="py-3.5 px-4 text-right font-bold">
                      {row.conversions}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {formatDuration(row.totalCallDurationSeconds)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-on-surface-variant">
                      {row.systemCallsAttended} / {row.systemConversions}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SummaryTab;
