import type { AttendanceSummaryRow } from "@/types/attendance";
import { formatMinutes } from "@/utils/Date";

interface AttendanceSummaryTableProps {
  rows?: AttendanceSummaryRow[];
  isLoading: boolean;
  isError: boolean;
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

const pctTone = (pct: number) => {
  if (pct >= 90) return "text-emerald-700 bg-emerald-500/10";
  if (pct >= 75) return "text-amber-700 bg-amber-500/10";
  return "text-rose-700 bg-rose-500/10";
};

const AttendanceSummaryTable = ({
  rows,
  isLoading,
  isError,
}: AttendanceSummaryTableProps) => {
  const data = rows ?? [];

  return (
    <div className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-outline-variant/30 bg-surface-container-low/50">
              <th className="px-5 py-3.5 font-label-md text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Employee
              </th>
              <th className="px-5 py-3.5 font-label-md text-[11px] font-bold uppercase tracking-wider text-on-surface-variant text-center">
                Present
              </th>
              <th className="px-5 py-3.5 font-label-md text-[11px] font-bold uppercase tracking-wider text-on-surface-variant text-center">
                Late
              </th>
              <th className="px-5 py-3.5 font-label-md text-[11px] font-bold uppercase tracking-wider text-on-surface-variant text-center">
                Absent
              </th>
              <th className="px-5 py-3.5 font-label-md text-[11px] font-bold uppercase tracking-wider text-on-surface-variant text-center">
                Leave
              </th>
              <th className="px-5 py-3.5 font-label-md text-[11px] font-bold uppercase tracking-wider text-on-surface-variant text-center">
                Total Hours
              </th>
              <th className="px-5 py-3.5 font-label-md text-[11px] font-bold uppercase tracking-wider text-on-surface-variant text-right">
                Attendance %
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20 text-xs">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={7} className="px-5 py-4">
                    <div className="h-4 w-full max-w-md rounded bg-surface-container-high" />
                  </td>
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={7} className="px-6 py-14 text-center">
                  <span className="material-symbols-outlined text-3xl text-error block mb-2">
                    error
                  </span>
                  <p className="font-bold text-sm text-on-surface">
                    Failed to load the attendance summary
                  </p>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-14 text-center text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-4xl mb-2 text-outline block">
                    query_stats
                  </span>
                  <p className="font-bold text-sm">
                    No summary data for this range
                  </p>
                  <p className="text-xs text-on-surface-variant/70 mt-1">
                    Widen the date range or check that the branch has
                    attendance records.
                  </p>
                </td>
              </tr>
            ) : (
              data
                .slice()
                .sort((a, b) => b.attendancePercentage - a.attendancePercentage)
                .map((row) => (
                  <tr
                    key={row.employeeId}
                    className="hover:bg-surface-container-low/40 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {getInitials(row.name || row.email)}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-on-surface truncate">
                            {row.name || "—"}
                          </p>
                          <p className="text-[10px] text-on-surface-variant/70 truncate">
                            {row.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-emerald-700">
                      {row.presentDays}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-amber-700">
                      {row.lateDays}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-rose-700">
                      {row.absentDays}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-indigo-700">
                      {row.leaveDays}
                    </td>
                    <td className="px-5 py-3.5 text-center font-semibold text-on-surface">
                      {formatMinutes(row.totalWorkingMinutes)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span
                        className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 font-label-sm text-[11px] font-extrabold min-w-[54px] ${pctTone(row.attendancePercentage)}`}
                      >
                        {row.attendancePercentage.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceSummaryTable;