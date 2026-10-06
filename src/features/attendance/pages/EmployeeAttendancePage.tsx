import { useMemo, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useAttendanceRecords } from "../hooks/useAttendance";
import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_WORK_MODE_LABELS, type AttendanceStatus } from "@/types/attendance";
import { daysAgoInput, formatDate, formatTime, todayInput } from "@/utils/Date";
import TodayAttendanceAction from "../components/TodayAttendanceAction";

const STATUS_BADGE_CLASSES: Record<AttendanceStatus, string> = {
    present: "bg-emerald-500/10 text-emerald-700",
    late: "bg-amber-500/10 text-amber-700",
    half_day: "bg-sky-500/10 text-sky-700",
    absent: "bg-rose-500/10 text-rose-700",
    on_leave: "bg-indigo-500/10 text-indigo-700",
};

const EmployeeAttendancePage = () => {
    const user = useAuthStore((state) => state.user);
    const [page, setPage] = useState(1);
    const dateRange = useMemo(
        () => ({ dateFrom: daysAgoInput(29), dateTo: todayInput() }),
        []
    );

    // Paginated monthly log only — today's record lives in TodayAttendanceAction.
    const { data, isLoading, isFetching } = useAttendanceRecords({
        ...dateRange,
        employeeId: user?._id,
        page,
        limit: 10,
    });

    const pagination = data?.pagination;

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Top Banner Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-outline-variant/30 pb-4">
                <div>
                    <p className="font-label-sm text-xs font-bold uppercase tracking-widest text-primary/80">
                        {new Date().toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "short",
                            day: "numeric",
                        })}
                    </p>
                    <h1 className="font-headline-md text-3xl font-bold text-on-surface mt-0.5">
                        My Attendance
                    </h1>
                    <p className="font-body-md text-sm text-on-surface-variant">
                        Mark your daily punches and keep track of your monthly attendance history.
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                    {/* Today's action terminal — self-contained, fetches its own today record. */}
                    <TodayAttendanceAction />

                    {/* Monthly Logs Table */}
                    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-xl">
                                    calendar_month
                                </span>
                                <h3 className="font-headline-sm text-base font-bold text-on-surface">
                                    Monthly Attendance Record
                                </h3>
                            </div>
                            <span className="font-label-sm text-xs font-semibold text-on-surface-variant">
                                This Month
                            </span>
                        </div>

                        {/* Table Container */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-outline-variant/20 text-on-surface-variant/70 font-bold uppercase tracking-wider text-[10px]">
                                        <th className="px-5 py-3">Date</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3">Mode</th>
                                        <th className="px-5 py-3">Check In</th>
                                        <th className="px-5 py-3">Check Out</th>
                                        <th className="px-5 py-3">Hours</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant/20 text-on-surface font-medium">
                                    {isLoading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan={6} className="px-5 py-4">
                                                    <div className="h-4 w-full max-w-sm rounded bg-surface-container-high" />
                                                </td>
                                            </tr>
                                        ))
                                    ) : !data || data.records.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant">
                                                <span className="material-symbols-outlined text-3xl mb-2 text-outline block">
                                                    event_busy
                                                </span>
                                                <p className="font-bold text-sm">No records in this range</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        data.records.map((log) => (
                                            <tr key={log.date} className="hover:bg-surface-container-low/50 transition-colors">
                                                <td className="py-3 px-4 font-bold">{formatDate(log.date)}</td>
                                                <td className="py-3 px-4 uppercase text-[11px] font-bold text-on-surface-variant">
                                                    {ATTENDANCE_WORK_MODE_LABELS[log.workMode]}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span
                                                        className={`inline-block rounded-full px-2.5 py-1 font-label-sm text-[10px] font-bold ${STATUS_BADGE_CLASSES[log.status]}`}
                                                    >
                                                        {ATTENDANCE_STATUS_LABELS[log.status]}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {log.checkInAt ? formatTime(log.checkInAt) : "-"}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {log.checkOutAt ? formatTime(log.checkOutAt) : "-"}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {log.lateMinutes > 0 ? (
                                                        <span className="text-error font-bold">{log.lateMinutes} mins</span>
                                                    ) : (
                                                        <span className="text-on-surface-variant/60">On Time</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {pagination && pagination.total > 0 && (
                            <div className="flex items-center justify-between border-t border-outline-variant/30 px-5 py-3.5">
                                <p className="font-body-sm text-xs text-on-surface-variant">
                                    Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
                                    {isFetching && " · refreshing…"}
                                </p>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                        disabled={pagination.page <= 1}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
                                    >
                                        <span className="material-symbols-outlined text-lg">chevron_left</span>
                                    </button>
                                    <button
                                        onClick={() => setPage((p) => p + 1)}
                                        disabled={pagination.page >= pagination.totalPages}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
                                    >
                                        <span className="material-symbols-outlined text-lg">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
            </div>
        </div>
    );
};


export default EmployeeAttendancePage;
