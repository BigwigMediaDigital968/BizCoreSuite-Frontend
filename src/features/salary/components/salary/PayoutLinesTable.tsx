import { Fragment, useState } from "react";

import Tooltip from "@/components/ui/Tooltip";
import type { PayoutLine, PayoutTotals } from "@/types/salary";
import PayoutLineBreakdown, { type BreakdownEditHandlers } from "./PayoutLineBreakdown";
import { days, inr } from "../../utils";

interface PayoutLinesTableProps {
  lines: PayoutLine[];
  totals: PayoutTotals;
  /** Preview only: edit handlers for one employee's line. */
  editHandlers?: (employeeId: string) => BreakdownEditHandlers;
  onRemove?: (employeeId: string) => void;
}

/** What each column means; the short headers are explained on hover/focus. */
const HEADERS: { label: string; tip: string }[] = [
  { label: "Working", tip: "Working days in the period: the branch's working weekdays, minus holidays and week offs, from the joining date." },
  { label: "Present", tip: "Days the employee checked in. A half day counts as 0.5." },
  { label: "Late", tip: "Days checked in after the branch start time plus its grace period." },
  { label: "Paid leave", tip: "Approved leave under a paid leave policy. Half-day leave counts as 0.5." },
  { label: "LOP days", tip: "Loss of pay: unpaid days. Absences and unpaid leave count 1 each; half days count 0.5." },
  { label: "Gross", tip: "Earnings for the period before deductions: the per-day rate × the days the employee is entitled to." },
  { label: "Deductions", tip: "Loss of pay, late penalty, recorded deductions, PF, ESI and professional tax." },
  { label: "Net", tip: "Take-home pay: gross − deductions ± one-off adjustments." },
];

const COLUMNS = HEADERS.length + 1;

// The employee column stays pinned when the table scrolls sideways; it needs
// an opaque background so the numbers don't show through it.
const pinned =
  "sticky left-0 z-[1] bg-surface-container-lowest shadow-[1px_0_0_0_var(--color-outline-variant,rgba(0,0,0,0.08))]";

const PayoutLinesTable = ({ lines, totals, editHandlers, onRemove }: PayoutLinesTableProps) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-4xl border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant/20 bg-surface-container-low text-[11px] uppercase tracking-wider text-on-surface-variant/80">
              <th className={`${pinned} bg-surface-container-low py-3 pl-4 pr-3`}>Employee</th>
              {HEADERS.map((h, i) => (
                <th
                  key={h.label}
                  className={`whitespace-nowrap py-3 text-right font-semibold ${i === HEADERS.length - 1 ? "px-4" : "px-3"}`}
                >
                  <Tooltip content={h.tip} className="border-b border-dotted border-on-surface-variant/50 uppercase tracking-wider">
                    {h.label}
                  </Tooltip>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20 text-xs text-on-surface">
            {lines.map((line) => {
              const id = line.employee;
              const open = expanded.has(id);
              const edited = line.overrides.length > 0;
              const pendingDecisions = line.manualDeductions.filter((d) => d.decision === "pending").length;
              return (
                <Fragment key={id}>
                  <tr
                    onClick={() => toggle(id)}
                    className={`group cursor-pointer transition-colors ${open ? "bg-surface-container-low/60" : "hover:bg-surface-container-low/40"}`}
                  >
                    <td className={`${pinned} py-2.5 pl-2 pr-3 ${open ? "bg-surface-container-low" : "group-hover:bg-surface-container-low"}`}>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggle(id);
                          }}
                          aria-expanded={open}
                          aria-label={`${open ? "Collapse" : "Expand"} breakdown for ${line.name}`}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <span className={`material-symbols-outlined text-lg transition-transform ${open ? "rotate-90" : ""}`}>
                            chevron_right
                          </span>
                        </button>
                        <div className="min-w-0 max-w-56">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate font-bold">{line.name}</p>
                            {pendingDecisions > 0 && (
                              <span className="shrink-0 rounded-md bg-surface-container-high px-1.5 py-0.5 text-[10px] font-bold text-on-surface-variant">
                                {pendingDecisions} pending
                              </span>
                            )}
                          </div>
                          <p className="truncate text-[11px] text-on-surface-variant">
                            {[line.employeeCode, line.branch?.name].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{days(line.days.working)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{days(line.days.present)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{line.lateCount}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{days(line.days.paidLeave)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{days(line.days.lop)}</td>
                    <td className="whitespace-nowrap py-2.5 px-3 text-right tabular-nums">{inr(line.earnings.gross)}</td>
                    <td className="whitespace-nowrap py-2.5 px-3 text-right tabular-nums">
                      {inr(line.deductions.total)}
                      {edited && (
                        <span
                          className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-500 align-middle"
                          title="Edited manually"
                        />
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="whitespace-nowrap font-extrabold tabular-nums">{inr(line.net)}</span>
                        {onRemove && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemove(id);
                            }}
                            aria-label={`Remove ${line.name} from this payout`}
                            title="Remove from this payout"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-on-surface-variant/60 hover:bg-error/10 hover:text-error"
                          >
                            <span className="material-symbols-outlined text-base">person_remove</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {open && (
                    <tr>
                      <td colSpan={COLUMNS} className="p-0">
                        <PayoutLineBreakdown line={line} edit={editHandlers?.(id)} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-outline-variant/30 bg-surface-container-low text-xs font-bold">
              <td className={`${pinned} bg-surface-container-low py-3 pl-4 pr-3`}>
                {totals.employees} employee{totals.employees === 1 ? "" : "s"}
              </td>
              <td colSpan={5} />
              <td className="whitespace-nowrap py-3 px-3 text-right tabular-nums">{inr(totals.gross)}</td>
              <td className="whitespace-nowrap py-3 px-3 text-right tabular-nums">{inr(totals.deductions)}</td>
              <td className="whitespace-nowrap py-3 px-4 text-right font-extrabold tabular-nums">{inr(totals.net)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default PayoutLinesTable;
