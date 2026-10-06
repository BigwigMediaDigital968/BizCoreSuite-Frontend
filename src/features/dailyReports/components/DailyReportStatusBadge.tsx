import { DAILY_REPORT_STATUS, type DailyReport } from "@/types/dailyReport";

const base =
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-label-sm text-[10px] font-bold uppercase tracking-wider";

const DailyReportStatusBadge = ({ report }: { report: DailyReport }) => (
  <div className="flex flex-wrap items-center gap-1.5">
    {report.status === DAILY_REPORT_STATUS.LATE ? (
      <span className={`${base} bg-amber-500/15 text-amber-700`}>Late</span>
    ) : (
      <span className={`${base} bg-emerald-500/15 text-emerald-700`}>
        On time
      </span>
    )}
    {report.review?.reviewedAt && (
      <span className={`${base} bg-primary/10 text-primary`}>
        <span className="material-symbols-outlined text-xs">done_all</span>
        Reviewed
      </span>
    )}
  </div>
);

export default DailyReportStatusBadge;
