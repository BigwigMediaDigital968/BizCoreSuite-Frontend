import { useState } from "react";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { SalarySettings, SalarySettingsValues } from "@/types/salary";
import {
  useResetSalarySettings,
  useSalarySettings,
  useUpdateSalarySettings,
} from "../../hooks/useSalary";
import { controlClass, formatDateTime, inr } from "../../utils";

const EXAMPLE_GROSS = 50_000;
const EXAMPLE_WORKING_DAYS = 26;
const EXAMPLE_LATES = 5;

const toValues = (s: SalarySettingsValues): SalarySettingsValues => ({
  perDayBasis: s.perDayBasis,
  lateRule: { ...s.lateRule },
  halfDayRule: { ...s.halfDayRule },
  missedCheckoutPolicy: s.missedCheckoutPolicy,
  absenceRequiresApproval: s.absenceRequiresApproval,
  statutoryProration: s.statutoryProration,
});

const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <div className="grid gap-3 border-b border-outline-variant/20 py-5 last:border-0 md:grid-cols-[16rem_1fr]">
    <div>
      <p className="text-sm font-bold text-on-surface">{title}</p>
      <p className="text-[11px] text-on-surface-variant">{description}</p>
    </div>
    <div className="space-y-3">{children}</div>
  </div>
);

const Toggle = ({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) => (
  <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-on-surface">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
    {label}
  </label>
);

const NumberInput = ({
  label,
  value,
  onChange,
  min = 0,
  step = 1,
  disabled,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
  disabled?: boolean;
  suffix?: string;
}) => (
  <label className="block space-y-1">
    <span className="block text-[11px] font-medium text-on-surface-variant">{label}</span>
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min={min}
        step={step}
        value={Number.isFinite(value) ? value : ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))}
        className={`${controlClass} w-28 disabled:opacity-50`}
      />
      {suffix && <span className="text-[11px] text-on-surface-variant">{suffix}</span>}
    </div>
  </label>
);

const SalaryRulesForm = () => {
  const { data: settings, isLoading, isError } = useSalarySettings();

  if (isLoading) {
    return <div className="h-64 rounded-2xl bg-surface-container-high animate-pulse" />;
  }
  if (isError || !settings) {
    return <p className="py-10 text-center text-xs text-on-surface-variant">Failed to load salary rules.</p>;
  }

  // Remounts after a save or reset, so the form restarts from the server copy.
  return <RulesEditor key={`${settings.isDefault}-${settings.updatedAt ?? ""}`} settings={settings} />;
};

const RulesEditor = ({ settings }: { settings: SalarySettings }) => {
  const update = useUpdateSalarySettings();
  const reset = useResetSalarySettings();
  const [editing, setEditing] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [form, setForm] = useState<SalarySettingsValues>(() => toValues(settings));

  if (settings.isDefault && !editing) {
    return (
      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 text-center shadow-sm">
        <span className="material-symbols-outlined text-3xl text-primary">rule</span>
        <p className="mt-2 text-sm font-bold text-on-surface">No salary rules configured</p>
        <p className="mx-auto mt-1 max-w-md text-xs text-on-surface-variant">
          Payouts use the defaults: only half days (under half the branch shift) and absences, including
          unpaid leave, are deducted. Lates are shown but not deducted.
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-on-primary shadow-sm"
        >
          Configure rules
        </button>
      </div>
    );
  }

  const set = <K extends keyof SalarySettingsValues>(key: K, value: SalarySettingsValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const setLate = (patch: Partial<SalarySettingsValues["lateRule"]>) =>
    setForm((f) => ({ ...f, lateRule: { ...f.lateRule, ...patch } }));
  const setHalf = (patch: Partial<SalarySettingsValues["halfDayRule"]>) =>
    setForm((f) => ({ ...f, halfDayRule: { ...f.halfDayRule, ...patch } }));

  const { lateRule } = form;
  const valid =
    Number.isFinite(lateRule.freeLatesPerMonth) &&
    Number.isFinite(lateRule.everyNLates) &&
    lateRule.everyNLates >= 1 &&
    Number.isFinite(lateRule.deductionDays) &&
    (lateRule.severeLateMinutes === null || lateRule.severeLateMinutes >= 1) &&
    (form.halfDayRule.minWorkingMinutes === null || form.halfDayRule.minWorkingMinutes >= 1);

  const exampleBlocks = lateRule.enabled
    ? Math.floor(Math.max(0, EXAMPLE_LATES - lateRule.freeLatesPerMonth) / Math.max(1, lateRule.everyNLates))
    : 0;
  const exampleAmount = (exampleBlocks * lateRule.deductionDays * EXAMPLE_GROSS) / EXAMPLE_WORKING_DAYS;

  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-outline-variant/20 py-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-on-surface">Salary rules</p>
          <p className="text-[11px] text-on-surface-variant">
            {settings.isDefault
              ? "Not saved yet. These are the defaults."
              : `Last saved ${formatDateTime(settings.updatedAt)}`}
          </p>
        </div>
        {!settings.isDefault && (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="rounded-xl px-4 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container hover:text-error"
          >
            Reset to defaults
          </button>
        )}
        {settings.isDefault && (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-xl px-4 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={() => update.mutate(form, { onSuccess: () => setEditing(false) })}
          disabled={!valid || update.isPending}
          className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-on-primary shadow-sm disabled:opacity-40"
        >
          {update.isPending ? "Saving…" : "Save rules"}
        </button>
      </div>

      <Section title="Per-day rate" description="Monthly gross is divided by this to get the value of one day.">
        <select
          value={form.perDayBasis}
          onChange={(e) => set("perDayBasis", e.target.value as SalarySettingsValues["perDayBasis"])}
          className={controlClass}
        >
          <option value="working_days">Working days in the month (branch schedule)</option>
          <option value="calendar_days">Calendar days in the month</option>
          <option value="fixed_30">Fixed 30 days</option>
        </select>
      </Section>

      <Section title="Late penalty" description="Turns late check-ins into a deduction, counted per calendar month.">
        <Toggle checked={lateRule.enabled} onChange={(v) => setLate({ enabled: v })} label="Deduct for late check-ins" />
        <div className="flex flex-wrap gap-4">
          <NumberInput label="Free lates per month" value={lateRule.freeLatesPerMonth} disabled={!lateRule.enabled} onChange={(v) => setLate({ freeLatesPerMonth: v })} />
          <NumberInput label="Then, for every" value={lateRule.everyNLates} min={1} disabled={!lateRule.enabled} onChange={(v) => setLate({ everyNLates: v })} suffix="lates" />
          <NumberInput label="Deduct" value={lateRule.deductionDays} step={0.5} disabled={!lateRule.enabled} onChange={(v) => setLate({ deductionDays: v })} suffix="day(s)" />
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <Toggle
            checked={lateRule.severeLateMinutes !== null}
            onChange={(v) => setLate({ severeLateMinutes: v ? 120 : null })}
            label="Very late counts as ½ day on its own"
          />
          {lateRule.severeLateMinutes !== null && (
            <NumberInput label="More than" value={lateRule.severeLateMinutes} min={1} onChange={(v) => setLate({ severeLateMinutes: v })} suffix="minutes late" />
          )}
        </div>
        {lateRule.enabled && (
          <p className="rounded-lg bg-surface-container-low px-3 py-2 text-[11px] text-on-surface-variant">
            Example: {EXAMPLE_LATES} lates in a month → {exampleBlocks} × {lateRule.deductionDays} day ={" "}
            <b>{inr(Math.round(exampleAmount))}</b> at {inr(EXAMPLE_GROSS)} gross ({EXAMPLE_WORKING_DAYS} working days).
          </p>
        )}
      </Section>

      <Section title="Half day" description="A day with fewer hours worked than this is paid as half a day.">
        <Toggle checked={form.halfDayRule.enabled} onChange={(v) => setHalf({ enabled: v })} label="Mark short days as half days" />
        <div className="flex flex-wrap items-end gap-3">
          <Toggle
            checked={form.halfDayRule.minWorkingMinutes === null}
            onChange={(v) => setHalf({ minWorkingMinutes: v ? null : 240 })}
            label="Use half the branch shift length"
          />
          {form.halfDayRule.minWorkingMinutes !== null && (
            <NumberInput label="Minimum worked" value={form.halfDayRule.minWorkingMinutes} min={1} onChange={(v) => setHalf({ minWorkingMinutes: v })} suffix="minutes" />
          )}
        </div>
      </Section>

      <Section title="Missed checkout" description="A day with a check-in but no checkout.">
        <select
          value={form.missedCheckoutPolicy}
          onChange={(e) => set("missedCheckoutPolicy", e.target.value as SalarySettingsValues["missedCheckoutPolicy"])}
          className={controlClass}
        >
          <option value="full_day">Count as a full day</option>
          <option value="half_day">Count as a half day</option>
        </select>
      </Section>

      <Section title="Absences" description="Working days with no check-in, leave or holiday.">
        <Toggle
          checked={form.absenceRequiresApproval}
          onChange={(v) => set("absenceRequiresApproval", v)}
          label="Review each absence in the payout preview before it's deducted"
        />
      </Section>

      <Section title="PF, ESI, professional tax" description="For payouts that don't cover a full month.">
        <select
          value={form.statutoryProration}
          onChange={(e) => set("statutoryProration", e.target.value as SalarySettingsValues["statutoryProration"])}
          className={controlClass}
        >
          <option value="prorate">Prorate by payable days</option>
          <option value="full_if_any_payable_day">Full amount if any day is payable</option>
        </select>
      </Section>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => reset.mutate(undefined, { onSuccess: () => setConfirmReset(false) })}
        title="Reset to default rules?"
        description="Saved rules are removed. Future payouts will deduct only half days and absences."
        confirmLabel="Reset"
        tone="danger"
        isLoading={reset.isPending}
      />
    </div>
  );
};

export default SalaryRulesForm;
