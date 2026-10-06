import type { AttendanceSummaryRow } from "@/types/attendance";

interface AttendanceSummaryCardsProps {
  summary?: AttendanceSummaryRow[];
  isLoading?: boolean;
}

const Card = ({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: string;
  tone: "primary" | "emerald" | "amber" | "rose" | "indigo";
}) => {
  const palette: Record<typeof tone, string> = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-700",
    amber: "bg-amber-500/10 text-amber-700",
    rose: "bg-rose-500/10 text-rose-700",
    indigo: "bg-indigo-500/10 text-indigo-700",
  } as const;

  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-label-sm text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/70">
          {label}
        </span>
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-xl ${palette[tone]}`}
        >
          <span className="material-symbols-outlined text-lg">{icon}</span>
        </span>
      </div>
      <p className="font-headline-md text-2xl font-extrabold text-on-surface">
        {value}
      </p>
    </div>
  );
};

const AttendanceSummaryCards = ({
  summary,
  isLoading,
}: AttendanceSummaryCardsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest animate-pulse"
          />
        ))}
      </div>
    );
  }

  const rows = summary ?? [];

  const totals = rows.reduce(
    (acc, row) => {
      acc.totalDays += row.totalDays;
      acc.present += row.presentDays;
      acc.late += row.lateDays;
      acc.absent += row.absentDays;
      acc.leave += row.leaveDays;
      return acc;
    },
    { totalDays: 0, present: 0, late: 0, absent: 0, leave: 0 }
  );

  const avgAttendance =
    totals.totalDays > 0
      ? ((totals.present / totals.totalDays) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      <Card
        label="Employees Tracked"
        value={String(rows.length)}
        icon="groups"
        tone="primary"
      />
      <Card
        label="Present Days"
        value={String(totals.present)}
        icon="check_circle"
        tone="emerald"
      />
      <Card
        label="Late Days"
        value={String(totals.late)}
        icon="schedule"
        tone="amber"
      />
      <Card
        label="Absent Days"
        value={String(totals.absent)}
        icon="event_busy"
        tone="rose"
      />
      <Card
        label="On Leave"
        value={String(totals.leave)}
        icon="beach_access"
        tone="indigo"
      />
      <Card
        label="Avg. Attendance"
        value={`${avgAttendance}%`}
        icon="insights"
        tone="primary"
      />
    </div>
  );
};

export default AttendanceSummaryCards;