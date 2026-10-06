import {
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_WORK_MODE,
  ATTENDANCE_WORK_MODE_LABELS,
  type AttendanceListData,
  type AttendanceRecord,
  type AttendanceStatus,
} from "@/types/attendance";
import { formatDate, formatMinutes, formatTime } from "@/utils/Date";

interface AttendanceRecordsTableProps {
  data?: AttendanceListData;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  showBranchColumn: boolean;
  page: number;
  onPageChange: (page: number) => void;
}

const STATUS_BADGE_CLASSES: Record<AttendanceStatus, string> = {
  present: "bg-emerald-500/10 text-emerald-700",
  late: "bg-amber-500/10 text-amber-700",
  half_day: "bg-sky-500/10 text-sky-700",
  absent: "bg-rose-500/10 text-rose-700",
  on_leave: "bg-indigo-500/10 text-indigo-700",
};

const STATUS_DOT_CLASSES: Record<AttendanceStatus, string> = {
  present: "bg-emerald-500",
  late: "bg-amber-500",
  half_day: "bg-sky-500",
  absent: "bg-rose-500",
  on_leave: "bg-indigo-500",
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

const employeeRef = (record: AttendanceRecord) =>
  typeof record.employee === "object" ? record.employee : null;

const branchRef = (record: AttendanceRecord) =>
  typeof record.branch === "object" ? record.branch : null;

const AttendanceRecordsTable = ({
  data,
  isLoading,
  isFetching,
  isError,
  showBranchColumn,
  page,
  onPageChange,
}: AttendanceRecordsTableProps) => {
  const records = data?.records ?? [];
  const pagination = data?.pagination;

  return (
    <div className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-outline-variant/30 bg-surface-container-low/50">
              <th className="px-5 py-3.5 font-label-md text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Employee
              </th>
              {showBranchColumn && (
                <th className="px-5 py-3.5 font-label-md text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Branch
                </th>
              )}
              <th className="px-5 py-3.5 font-label-md text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Date
              </th>
              <th className="px-5 py-3.5 font-label-md text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Status
              </th>
              <th className="px-5 py-3.5 font-label-md text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Mode
              </th>
              <th className="px-5 py-3.5 font-label-md text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Check In
              </th>
              <th className="px-5 py-3.5 font-label-md text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Check Out
              </th>
              <th className="px-5 py-3.5 font-label-md text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Late
              </th>
              <th className="px-5 py-3.5 font-label-md text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Hours
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-outline-variant/20 text-xs">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="animate-pulse">
                  <td colSpan={showBranchColumn ? 9 : 8} className="px-5 py-4">
                    <div className="h-4 w-full max-w-md rounded bg-surface-container-high" />
                  </td>
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td
                  colSpan={showBranchColumn ? 9 : 8}
                  className="px-6 py-14 text-center"
                >
                  <span className="material-symbols-outlined text-3xl text-error block mb-2">
                    error
                  </span>
                  <p className="font-bold text-sm text-on-surface">
                    Failed to load attendance records
                  </p>
                  <p className="mt-1 text-xs text-on-surface-variant/70">
                    Please check your connection and try again.
                  </p>
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td
                  colSpan={showBranchColumn ? 9 : 8}
                  className="px-6 py-14 text-center text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-4xl mb-2 text-outline block">
                    event_busy
                  </span>
                  <p className="font-bold text-sm">
                    No attendance records found
                  </p>
                  <p className="text-xs text-on-surface-variant/70 mt-1">
                    Try widening the date range or adjusting your filters.
                  </p>
                </td>
              </tr>
            ) : (
              records.map((record) => {
                const employee = employeeRef(record);
                const branch = branchRef(record);
                return (
                  <tr
                    key={record._id}
                    className="hover:bg-surface-container-low/40 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {employee ? getInitials(employee.name) : "?"}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-on-surface truncate">
                            {employee?.name ?? "Unknown"}
                          </p>
                          <p className="text-[10px] text-on-surface-variant/70 truncate">
                            {employee?.email ?? "-"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {showBranchColumn && (
                      <td className="px-5 py-3.5">
                        <span className="inline-block rounded-md bg-surface-container-high px-2 py-0.5 font-mono text-[10px] font-bold text-on-surface-variant">
                          {branch?.code ?? "—"}
                        </span>
                      </td>
                    )}

                    <td className="px-5 py-3.5 font-semibold text-on-surface whitespace-nowrap">
                      {formatDate(record.date)}
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-label-sm text-[10px] font-bold ${STATUS_BADGE_CLASSES[record.status]}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT_CLASSES[record.status]}`}
                        />
                        {ATTENDANCE_STATUS_LABELS[record.status]}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 font-label-sm text-[10px] font-bold ${
                          record.workMode === ATTENDANCE_WORK_MODE.WFO
                            ? "bg-primary/10 text-primary"
                            : "bg-secondary/10 text-secondary"
                        }`}
                      >
                        {ATTENDANCE_WORK_MODE_LABELS[record.workMode]}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 font-mono text-on-surface-variant whitespace-nowrap">
                      {formatTime(record.checkInAt)}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-on-surface-variant whitespace-nowrap">
                      {formatTime(record.checkOutAt)}
                    </td>
                    <td className="px-5 py-3.5 text-on-surface-variant">
                      {record.lateMinutes > 0 ? (
                        <span className="font-bold text-amber-700">
                          {formatMinutes(record.lateMinutes)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-on-surface">
                      {formatMinutes(record.totalWorkingMinutes)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.total > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-outline-variant/30 px-5 py-3.5 bg-surface-container-lowest">
          <p className="font-body-sm text-xs text-on-surface-variant">
            Showing{" "}
            <span className="font-bold text-on-surface">
              {(pagination.page - 1) * pagination.limit + 1}
            </span>{" "}
            to{" "}
            <span className="font-bold text-on-surface">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{" "}
            of{" "}
            <span className="font-bold text-on-surface">
              {pagination.total}
            </span>{" "}
            records
            {isFetching && " · refreshing…"}
          </p>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(Math.max(page - 1, 1))}
              disabled={pagination.page <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
            >
              <span className="material-symbols-outlined text-lg">
                chevron_left
              </span>
            </button>
            <span className="px-3 text-xs font-bold text-on-surface">
              Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
            >
              <span className="material-symbols-outlined text-lg">
                chevron_right
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceRecordsTable;