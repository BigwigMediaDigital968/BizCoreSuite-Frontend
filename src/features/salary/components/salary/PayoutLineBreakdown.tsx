import { useState } from "react";

import { formatDate } from "@/utils/Date";
import {
  DEDUCTION_FIELDS,
  EARNING_FIELDS,
  FIELD_LABELS,
  type Decision,
  type OverrideField,
  type PayoutAdjustment,
  type PayoutLine,
} from "@/types/salary";
import EditableAmountCell from "./EditableAmountCell";
import { days, inr } from "../../utils";

export interface BreakdownEditHandlers {
  onOverride: (field: OverrideField, value: number, reason: string) => void;
  onResetOverride: (field: OverrideField) => void;
  onResetAll: () => void;
  onSuggestionDecision: (key: string, decision: Decision) => void;
  onDeductionDecision: (id: string, decision: Decision | "pending") => void;
  onAdjustmentsChange: (adjustments: PayoutAdjustment[]) => void;
}

interface PayoutLineBreakdownProps {
  line: PayoutLine;
  /** Omit for the read-only snapshot on the payout detail page. */
  edit?: BreakdownEditHandlers;
}

const DAY_STATS: { key: keyof PayoutLine["days"]; label: string }[] = [
  { key: "working", label: "Working" },
  { key: "present", label: "Present" },
  { key: "late", label: "Late" },
  { key: "halfDay", label: "Half days" },
  { key: "paidLeave", label: "Paid leave" },
  { key: "unpaidLeave", label: "Unpaid leave" },
  { key: "absent", label: "Absent" },
  { key: "holidays", label: "Holidays" },
  { key: "weekOffs", label: "Week offs" },
  { key: "lop", label: "LOP days" },
  { key: "payable", label: "Payable" },
];

const sectionTitle =
  "font-label-sm text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/70 mb-2";

const DecisionToggle = ({
  value,
  onChange,
  allowPending,
}: {
  value: Decision | "pending";
  onChange?: (value: Decision | "pending") => void;
  allowPending?: boolean;
}) => {
  const options: { id: Decision | "pending"; label: string; active: string }[] = [
    ...(allowPending
      ? [{ id: "pending" as const, label: "Leave pending", active: "bg-surface-container-high text-on-surface" }]
      : []),
    { id: "approved", label: "Deduct", active: "bg-error/10 text-error" },
    { id: "rejected", label: "Waive", active: "bg-emerald-500/10 text-emerald-700" },
  ];

  if (!onChange) {
    const current = options.find((o) => o.id === value);
    return (
      <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${current?.active ?? ""}`}>
        {value === "approved" ? "Deducted" : value === "rejected" ? "Waived" : "Pending"}
      </span>
    );
  }

  return (
    <div className="inline-flex rounded-lg border border-outline-variant/30 p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
          className={`rounded-md px-2 py-0.5 text-[11px] font-bold transition-colors ${
            value === o.id ? o.active : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
};

const AdjustmentEditor = ({
  adjustments,
  onChange,
}: {
  adjustments: PayoutAdjustment[];
  onChange: (next: PayoutAdjustment[]) => void;
}) => {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const parsed = Number(amount);
  const valid = label.trim() && amount.trim() !== "" && Number.isFinite(parsed) && parsed !== 0;

  const add = () => {
    if (!valid) return;
    onChange([
      ...adjustments,
      { label: label.trim(), amount: Math.round(parsed * 100) / 100, ...(note.trim() ? { note: note.trim() } : {}) },
    ]);
    setLabel("");
    setAmount("");
    setNote("");
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-2">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        maxLength={60}
        placeholder="Label (e.g. Bonus)"
        aria-label="Adjustment label"
        className="w-36 rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-2 py-1 text-[11px] outline-none focus:border-primary"
      />
      <input
        type="number"
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="+/- amount"
        aria-label="Adjustment amount"
        className="w-28 rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-2 py-1 text-right text-[11px] outline-none focus:border-primary"
      />
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={300}
        placeholder="Note (optional)"
        aria-label="Adjustment note"
        className="min-w-0 flex-1 rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-2 py-1 text-[11px] outline-none focus:border-primary"
      />
      <button
        type="button"
        onClick={add}
        disabled={!valid}
        className="flex items-center gap-1 rounded-lg border border-primary/40 px-2 py-1 text-[11px] font-bold text-primary hover:bg-primary/5 disabled:opacity-40"
      >
        <span className="material-symbols-outlined text-sm">add</span>
        Add
      </button>
    </div>
  );
};

const PayoutLineBreakdown = ({ line, edit }: PayoutLineBreakdownProps) => {
  const overrideFor = (field: OverrideField) =>
    line.overrides.find((o) => o.field === field);

  const amountCell = (field: OverrideField, value: number, emphasis?: boolean) => (
    <EditableAmountCell
      value={value}
      override={overrideFor(field)}
      emphasis={emphasis}
      onSave={edit ? (v, reason) => edit.onOverride(field, v, reason) : undefined}
      onReset={edit ? () => edit.onResetOverride(field) : undefined}
    />
  );

  const adjustmentTotal = line.adjustments.reduce((s, a) => s + a.amount, 0);

  return (
    <div className="space-y-4 bg-surface-container-low/40 px-4 py-4 sm:px-6">
      {line.warnings.length > 0 && (
        <ul className="space-y-1 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-800">
          {line.warnings.map((w) => (
            <li key={w} className="flex items-start gap-1.5">
              <span className="material-symbols-outlined text-sm">warning</span>
              {w}
            </li>
          ))}
        </ul>
      )}

      <div>
        <p className={sectionTitle}>Days</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-11">
          {DAY_STATS.map((s) => (
            <div
              key={s.key}
              className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-2 py-1.5 text-center"
            >
              <p className="text-sm font-extrabold tabular-nums">{days(line.days[s.key])}</p>
              <p className="text-[10px] text-on-surface-variant">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-on-surface-variant">
          Per-day rate {inr(line.perDayRate)} · monthly gross{" "}
          {inr(line.salarySnapshot.grossSalary)}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <p className={sectionTitle}>Earnings</p>
          <table className="w-full text-xs">
            <tbody className="divide-y divide-outline-variant/15">
              {EARNING_FIELDS.filter(
                (f) => line.salarySnapshot[f] || line.earnings[f] || overrideFor(`earnings.${f}`)
              ).map((f) => (
                <tr key={f}>
                  <td className="py-1.5 text-on-surface-variant">{FIELD_LABELS[f]}</td>
                  <td className="py-1.5">{amountCell(`earnings.${f}`, line.earnings[f])}</td>
                </tr>
              ))}
              <tr>
                <td className="py-1.5 font-bold">Gross</td>
                <td className="py-1.5 text-right font-extrabold tabular-nums">
                  {inr(line.earnings.gross)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <p className={sectionTitle}>Deductions</p>
          <table className="w-full text-xs">
            <tbody className="divide-y divide-outline-variant/15">
              {DEDUCTION_FIELDS.filter(
                (f) =>
                  ["lop", "lateRule", "manual"].includes(f) ||
                  line.deductions[f] ||
                  overrideFor(`deductions.${f}`)
              ).map((f) => (
                <tr key={f}>
                  <td className="py-1.5 text-on-surface-variant">
                    {FIELD_LABELS[f]}
                    {f === "lop" && line.days.lop > 0 && (
                      <span className="ml-1 text-[10px]">({days(line.days.lop)} days)</span>
                    )}
                  </td>
                  <td className="py-1.5">{amountCell(`deductions.${f}`, line.deductions[f])}</td>
                </tr>
              ))}
              <tr>
                <td className="py-1.5 font-bold">Total deductions</td>
                <td className="py-1.5 text-right font-extrabold tabular-nums">
                  {inr(line.deductions.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {line.suggestions.length > 0 && (
        <div>
          <p className={sectionTitle}>Suggested by the system</p>
          <ul className="divide-y divide-outline-variant/15 rounded-xl border border-outline-variant/20 bg-surface-container-lowest">
            {line.suggestions.map((s) => (
              <li key={s.key} className="flex flex-wrap items-center gap-2 px-3 py-2 text-xs">
                <span className="material-symbols-outlined text-base text-on-surface-variant">
                  {s.type === "late_rule" ? "schedule" : "event_busy"}
                </span>
                <span className="min-w-0 flex-1">{s.description}</span>
                <span className="tabular-nums font-semibold">
                  {days(s.days)} day · {inr(s.amount)}
                </span>
                <DecisionToggle
                  value={s.decision}
                  onChange={edit ? (d) => edit.onSuggestionDecision(s.key, d as Decision) : undefined}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {line.manualDeductions.length > 0 && (
        <div>
          <p className={sectionTitle}>Recorded deductions</p>
          <ul className="divide-y divide-outline-variant/15 rounded-xl border border-outline-variant/20 bg-surface-container-lowest">
            {line.manualDeductions.map((d) => (
              <li key={d._id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-xs">
                <span className="whitespace-nowrap text-on-surface-variant">{formatDate(d.date)}</span>
                <span className="min-w-0 flex-1">{d.reason}</span>
                <span className="tabular-nums font-semibold">
                  {d.days ? `${days(d.days)} day · ` : ""}
                  {inr(d.computedAmount)}
                </span>
                {d.status === "approved" ? (
                  <span className="rounded-md bg-error/10 px-2 py-0.5 text-[11px] font-bold text-error">
                    Approved
                  </span>
                ) : (
                  <DecisionToggle
                    value={d.decision}
                    allowPending
                    onChange={edit ? (v) => edit.onDeductionDecision(d._id, v) : undefined}
                  />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(line.adjustments.length > 0 || edit) && (
        <div>
          <p className={sectionTitle}>One-off adjustments</p>
          {line.adjustments.length > 0 && (
            <ul className="divide-y divide-outline-variant/15 rounded-xl border border-outline-variant/20 bg-surface-container-lowest">
              {line.adjustments.map((a, i) => (
                <li key={`${a.label}-${i}`} className="flex items-center gap-2 px-3 py-2 text-xs">
                  <span className="font-semibold">{a.label}</span>
                  {a.note && <span className="min-w-0 flex-1 truncate text-on-surface-variant">{a.note}</span>}
                  <span
                    className={`ml-auto tabular-nums font-bold ${a.amount < 0 ? "text-error" : "text-emerald-700"}`}
                  >
                    {a.amount > 0 ? "+" : ""}
                    {inr(a.amount)}
                  </span>
                  {edit && (
                    <button
                      type="button"
                      onClick={() => edit.onAdjustmentsChange(line.adjustments.filter((_, j) => j !== i))}
                      aria-label={`Remove ${a.label}`}
                      className="flex h-6 w-6 items-center justify-center rounded-md text-on-surface-variant/60 hover:text-error"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {edit && (
            <AdjustmentEditor adjustments={line.adjustments} onChange={edit.onAdjustmentsChange} />
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-outline-variant/20 pt-3 text-xs">
        {edit && line.overrides.length > 0 && (
          <button
            type="button"
            onClick={edit.onResetAll}
            className="mr-auto flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-on-surface-variant hover:bg-surface-container hover:text-error"
          >
            <span className="material-symbols-outlined text-sm">restart_alt</span>
            Reset all edits ({line.overrides.length})
          </button>
        )}
        <span className="text-on-surface-variant">
          {inr(line.earnings.gross)} − {inr(line.deductions.total)}
          {adjustmentTotal !== 0 && ` ${adjustmentTotal > 0 ? "+" : "−"} ${inr(Math.abs(adjustmentTotal))}`}
        </span>
        <span className="font-bold">Net</span>
        {amountCell("net", line.net, true)}
      </div>

      {!edit && line.overrides.length > 0 && (
        <div>
          <p className={sectionTitle}>Manual edits</p>
          <ul className="space-y-1 text-[11px]">
            {line.overrides.map((o) => (
              <li key={o.field}>
                <span className="font-semibold">{o.field}</span>: {inr(o.calculated)} → {inr(o.value)}{" "}
                <span className="text-on-surface-variant">({o.reason})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PayoutLineBreakdown;
