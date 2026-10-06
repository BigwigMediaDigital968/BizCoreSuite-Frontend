import { useState } from "react";

import { todayInput } from "@/utils/Date";
import { BranchSelect } from "./ReportFilterControls";
import { useMissingDailyReports } from "../hooks/useDailyReports";
import { filterControlClass as controlClass, formatClock } from "../utils";

const StatTile = ({
  label,
  value,
  tone = "text-on-surface",
}: {
  label: string;
  value: number | string;
  tone?: string;
}) => (
  <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 shadow-sm">
    <p className="font-label-sm text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
      {label}
    </p>
    <p className={`mt-1 font-headline-sm text-2xl font-extrabold ${tone}`}>
      {value}
    </p>
  </div>
);

const MissingReportsTab = () => {
  const [date, setDate] = useState(todayInput());
  const [branchId, setBranchId] = useState("");

  const { data, isLoading, isError } = useMissingDailyReports(
    date,
    branchId || undefined
  );

  const totals = data?.totals;
  const rate =
    totals && totals.expected > 0
      ? `${Math.round((totals.submitted / totals.expected) * 100)}%`
      : "—";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={date}
          max={todayInput()}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          aria-label="Report date"
          className={controlClass}
        />
        <BranchSelect value={branchId} onChange={setBranchId} />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Expected" value={totals?.expected ?? "—"} />
        <StatTile
          label="Submitted"
          value={totals ? `${totals.submitted} · ${rate}` : "—"}
          tone="text-emerald-700"
        />
        <StatTile
          label="Missing"
          value={totals?.missing ?? "—"}
          tone={totals?.missing ? "text-error" : "text-on-surface"}
        />
        <StatTile label="On leave" value={totals?.onLeave ?? "—"} />
      </div>

      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-low/50 font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant/70">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Branch</th>
                <th className="py-3 px-4">Window</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 font-body-sm text-xs text-on-surface">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4} className="py-3.5 px-4">
                      <div className="h-6 rounded-lg bg-surface-container-high animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={4} className="py-10 px-4 text-center text-on-surface-variant">
                    Failed to load missing reports.
                  </td>
                </tr>
              ) : !data || data.missing.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 px-4 text-center text-on-surface-variant">
                    {totals?.expected
                      ? "Everyone has submitted their report."
                      : "No reports are due for this date."}
                  </td>
                </tr>
              ) : (
                data.missing.map((row) => (
                  <tr key={row.employee._id}>
                    <td className="py-3.5 px-4">
                      <p className="font-label-md font-bold">{row.employee.name}</p>
                      <p className="text-[11px] text-on-surface-variant/70">
                        {row.employee.email}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant">
                      {row.branch.name}
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant whitespace-nowrap">
                      Due {formatClock(row.closesAt)} · late until{" "}
                      {formatClock(row.lateUntil)}
                    </td>
                    <td className="py-3.5 px-4">
                      {row.windowOpen ? (
                        <span className="inline-flex rounded-full bg-amber-500/15 px-2.5 py-0.5 font-label-sm text-[10px] font-bold uppercase tracking-wider text-amber-700">
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-error/10 px-2.5 py-0.5 font-label-sm text-[10px] font-bold uppercase tracking-wider text-error">
                          Missed
                        </span>
                      )}
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

export default MissingReportsTab;
