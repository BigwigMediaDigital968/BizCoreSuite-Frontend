import { Link, useParams } from "react-router";

import Tooltip from "@/components/ui/Tooltip";
import { ROUTES } from "@/config/routes";
import { formatDate } from "@/utils/Date";
import { DEDUCTION_FIELDS, EARNING_FIELDS, FIELD_LABELS } from "@/types/salary";
import { useMyPayslip } from "../hooks/useSalary";
import { days, formatDateTime, formatPeriod, inr, MY_STATUS } from "../utils";

const DAY_STATS = [
  { key: "working", label: "Working days", tip: "Your branch's working weekdays in this period, minus holidays and week offs." },
  { key: "present", label: "Present", tip: "Days you checked in. A half day counts as 0.5." },
  { key: "late", label: "Late", tip: "Days you checked in after the start time plus the grace period." },
  { key: "paidLeave", label: "Paid leave", tip: "Approved leave under a paid leave policy." },
  { key: "lop", label: "Loss of pay", tip: "Unpaid days: absences, unpaid leave, and half days (0.5 each)." },
  { key: "payable", label: "Paid days", tip: "Days you're paid for in this period." },
] as const;

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm">
    <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/80">{title}</h2>
    {children}
  </div>
);

const MyPayslipPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: payslip, isLoading, isError } = useMyPayslip(id);

  const back = (
    <Link to={ROUTES.myPayouts} className="inline-flex items-center gap-1 text-xs font-bold text-on-surface-variant hover:text-primary">
      <span className="material-symbols-outlined text-base">arrow_back</span>
      My Payouts
    </Link>
  );

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        {back}
        <div className="h-64 rounded-2xl bg-surface-container-high animate-pulse" />
      </div>
    );
  }
  if (isError || !payslip) {
    return (
      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        {back}
        <p className="py-10 text-center text-xs text-on-surface-variant">Payslip not found.</p>
      </div>
    );
  }

  const { line } = payslip;
  const status = MY_STATUS[payslip.status];
  const adjustmentTotal = line.adjustments.reduce((s, a) => s + a.amount, 0);

  return (
    <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8 space-y-5">
      <div className="space-y-3 border-b border-outline-variant/30 pb-5">
        {back}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-headline-md text-2xl font-extrabold text-on-surface sm:text-3xl">
                {formatPeriod(payslip.from, payslip.to)}
              </h1>
              <span className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${status.className}`}>
                <span className="material-symbols-outlined text-sm">{status.icon}</span>
                {status.label}
              </span>
            </div>
            <p className="mt-1 text-xs text-on-surface-variant">
              {payslip.payoutNo} · {[line.employeeCode, line.designation, line.branch?.name].filter(Boolean).join(" · ")}
            </p>
            {payslip.status === "paid" && payslip.paidAt && (
              <p className="text-xs text-emerald-700">Paid {formatDateTime(payslip.paidAt)}</p>
            )}
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/80">Net pay</p>
            <p className="text-3xl font-extrabold tabular-nums text-primary">{inr(line.net)}</p>
          </div>
        </div>
      </div>

      <Section title="Attendance">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {DAY_STATS.map((s) => (
            <div key={s.key} className="rounded-xl border border-outline-variant/20 bg-surface-container-low/40 px-3 py-2">
              <dt className="text-[11px] text-on-surface-variant">
                <Tooltip content={s.tip} className="border-b border-dotted border-on-surface-variant/50">
                  {s.label}
                </Tooltip>
              </dt>
              <dd className="text-lg font-extrabold tabular-nums text-on-surface">
                {s.key === "late" ? line.lateCount : days(line.days[s.key])}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-[11px] text-on-surface-variant">
          Monthly gross {inr(line.monthlyGross)} · one day is worth {inr(line.perDayRate)}
        </p>
      </Section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Earnings">
          <table className="w-full text-xs">
            <tbody className="divide-y divide-outline-variant/15">
              {EARNING_FIELDS.filter((f) => line.earnings[f]).map((f) => (
                <tr key={f}>
                  <td className="py-2 text-on-surface-variant">{FIELD_LABELS[f]}</td>
                  <td className="py-2 text-right font-semibold tabular-nums">{inr(line.earnings[f])}</td>
                </tr>
              ))}
              <tr>
                <td className="py-2 font-bold">Gross earnings</td>
                <td className="py-2 text-right font-extrabold tabular-nums">{inr(line.earnings.gross)}</td>
              </tr>
            </tbody>
          </table>
        </Section>

        <Section title="Deductions">
          <table className="w-full text-xs">
            <tbody className="divide-y divide-outline-variant/15">
              {DEDUCTION_FIELDS.filter((f) => line.deductions[f]).map((f) => (
                <tr key={f}>
                  <td className="py-2 text-on-surface-variant">
                    {FIELD_LABELS[f]}
                    {f === "lop" && <span className="ml-1 text-[10px]">({days(line.days.lop)} days)</span>}
                  </td>
                  <td className="py-2 text-right font-semibold tabular-nums">{inr(line.deductions[f])}</td>
                </tr>
              ))}
              {line.deductions.total === 0 && (
                <tr>
                  <td colSpan={2} className="py-2 text-on-surface-variant">No deductions this period.</td>
                </tr>
              )}
              <tr>
                <td className="py-2 font-bold">Total deductions</td>
                <td className="py-2 text-right font-extrabold tabular-nums">{inr(line.deductions.total)}</td>
              </tr>
            </tbody>
          </table>
          {line.deductionItems.length > 0 && (
            <ul className="mt-3 space-y-1 border-t border-outline-variant/20 pt-3 text-[11px] text-on-surface-variant">
              {line.deductionItems.map((d, i) => (
                <li key={`${d.date}-${i}`} className="flex justify-between gap-3">
                  <span>
                    {formatDate(d.date)} · {d.description}
                  </span>
                  <span className="shrink-0 tabular-nums">{inr(d.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section title="Net pay">
        <dl className="space-y-1.5 text-xs">
          <div className="flex justify-between"><dt className="text-on-surface-variant">Gross earnings</dt><dd className="tabular-nums font-semibold">{inr(line.earnings.gross)}</dd></div>
          <div className="flex justify-between"><dt className="text-on-surface-variant">Deductions</dt><dd className="tabular-nums font-semibold">− {inr(line.deductions.total)}</dd></div>
          {line.adjustments.map((a, i) => (
            <div key={`${a.label}-${i}`} className="flex justify-between">
              <dt className="text-on-surface-variant">{a.label}</dt>
              <dd className={`tabular-nums font-semibold ${a.amount < 0 ? "text-error" : "text-emerald-700"}`}>
                {a.amount > 0 ? "+ " : "− "}
                {inr(Math.abs(a.amount))}
              </dd>
            </div>
          ))}
          <div className="flex justify-between border-t border-outline-variant/20 pt-2 text-sm">
            <dt className="font-bold">Net pay</dt>
            <dd className="font-extrabold tabular-nums text-primary">{inr(line.net)}</dd>
          </div>
          {adjustmentTotal === 0 && line.net !== Math.max(0, line.earnings.gross - line.deductions.total) && (
            <p className="pt-1 text-[11px] text-on-surface-variant">Net pay was set by management for this period.</p>
          )}
        </dl>
      </Section>
    </div>
  );
};

export default MyPayslipPage;
