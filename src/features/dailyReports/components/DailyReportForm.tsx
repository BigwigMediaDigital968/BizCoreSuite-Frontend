import { useEffect, useState, type FormEvent } from "react";

import {
  formatMetric,
  isMetricMismatch,
  type DailyReport,
  type DailyReportCustomField,
  type DailyReportMetrics,
  type DailyReportSystemMetrics,
  type SubmitDailyReportPayload,
} from "@/types/dailyReport";
import CustomFieldsEditor from "./CustomFieldsEditor";
import { readDraft, writeDraft } from "../utils";

interface FormState {
  workCompleted: string;
  callsAttended: string;
  callsAnswered: string;
  conversions: string;
  durationHours: string;
  durationMinutes: string;
  dailyFeedback: string;
  customFields: DailyReportCustomField[];
}

type FormErrors = Partial<Record<keyof FormState | "duration", string>>;

const fromMetrics = (
  metrics: DailyReportMetrics,
  extra: Partial<FormState> = {}
): FormState => {
  const totalMinutes = Math.round(metrics.totalCallDurationSeconds / 60);
  return {
    workCompleted: "",
    callsAttended: String(metrics.callsAttended),
    callsAnswered: String(metrics.callsAnswered),
    conversions: String(metrics.conversions),
    durationHours: String(Math.floor(totalMinutes / 60)),
    durationMinutes: String(totalMinutes % 60),
    dailyFeedback: "",
    customFields: [],
    ...extra,
  };
};

/** Draft (unsent edits) > saved report > what the system recorded. */
const initialState = (
  report: DailyReport | null,
  systemMetrics: DailyReportSystemMetrics,
  draftKey: string
): FormState => {
  const draft = readDraft<FormState>(draftKey);
  if (draft) return draft;

  if (report) {
    return fromMetrics(report, {
      workCompleted: report.workCompleted,
      dailyFeedback: report.dailyFeedback ?? "",
      customFields: report.customFields ?? [],
    });
  }

  return fromMetrics(systemMetrics);
};

const toInt = (value: string) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : NaN;
};

const validate = (state: FormState): FormErrors => {
  const errors: FormErrors = {};

  if (!state.workCompleted.trim()) {
    errors.workCompleted = "Describe the work you completed today";
  }

  for (const key of ["callsAttended", "callsAnswered", "conversions"] as const) {
    if (Number.isNaN(toInt(state[key]))) errors[key] = "Enter a whole number";
  }

  if (
    !errors.callsAnswered &&
    !errors.callsAttended &&
    toInt(state.callsAnswered) > toInt(state.callsAttended)
  ) {
    errors.callsAnswered = "Can't be more than calls attended";
  }

  const h = toInt(state.durationHours || "0");
  const m = toInt(state.durationMinutes || "0");
  if (Number.isNaN(h) || Number.isNaN(m) || m > 59 || h * 60 + m > 24 * 60) {
    errors.duration = "Enter hours and minutes (0–59)";
  }

  const labels = state.customFields.map((f) => f.label.trim().toLowerCase());
  if (labels.some((l) => !l)) {
    errors.customFields = "Every additional field needs a name";
  } else if (new Set(labels).size !== labels.length) {
    errors.customFields = "Additional field names must be unique";
  }

  return errors;
};

const toPayload = (state: FormState): SubmitDailyReportPayload => ({
  workCompleted: state.workCompleted.trim(),
  callsAttended: toInt(state.callsAttended),
  callsAnswered: toInt(state.callsAnswered),
  conversions: toInt(state.conversions),
  totalCallDurationSeconds:
    (toInt(state.durationHours || "0") * 60 +
      toInt(state.durationMinutes || "0")) *
    60,
  dailyFeedback: state.dailyFeedback.trim(),
  customFields: state.customFields.map((f) => ({
    label: f.label.trim(),
    value: f.value.trim(),
  })),
});

const inputClass =
  "w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary disabled:opacity-60";

const labelClass =
  "block font-label-md text-xs font-medium text-on-surface-variant";

interface DailyReportFormProps {
  report: DailyReport | null;
  systemMetrics: DailyReportSystemMetrics;
  draftKey: string;
  disabled?: boolean;
  isSubmitting?: boolean;
  onSubmit: (payload: SubmitDailyReportPayload) => void;
}

const DailyReportForm = ({
  report,
  systemMetrics,
  draftKey,
  disabled = false,
  isSubmitting = false,
  onSubmit,
}: DailyReportFormProps) => {
  const [state, setState] = useState<FormState>(() =>
    initialState(report, systemMetrics, draftKey)
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [dirty, setDirty] = useState(false);

  // Keep unsent edits across refreshes; the window is short.
  useEffect(() => {
    if (dirty && !disabled) writeDraft(draftKey, state);
  }, [state, dirty, disabled, draftKey]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setDirty(true);
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const reportedMetrics = (): DailyReportMetrics => {
    const payload = toPayload(state);
    return {
      callsAttended: payload.callsAttended,
      callsAnswered: payload.callsAnswered,
      conversions: payload.conversions,
      totalCallDurationSeconds: payload.totalCallDurationSeconds,
    };
  };

  const applySystemValue = (key: keyof DailyReportMetrics) => {
    if (key === "totalCallDurationSeconds") {
      const system = fromMetrics(systemMetrics);
      setDirty(true);
      setState((prev) => ({
        ...prev,
        durationHours: system.durationHours,
        durationMinutes: system.durationMinutes,
      }));
      return;
    }
    set(key, String(systemMetrics[key]));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const nextErrors = validate(state);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(toPayload(state));
  };

  const systemHint = (field: keyof DailyReportMetrics) => {
    const reported = reportedMetrics()[field];
    const system = systemMetrics[field];
    const differs =
      !Number.isNaN(reported) && isMetricMismatch(field, reported, system);

    return (
      <p className="flex flex-wrap items-center gap-1.5 font-body-sm text-[11px] text-on-surface-variant">
        <span className="material-symbols-outlined text-sm">
          {differs ? "info" : "verified"}
        </span>
        <span>System: {formatMetric(field, system)}</span>
        {differs && !disabled && (
          <button
            type="button"
            onClick={() => applySystemValue(field)}
            className="font-bold text-primary hover:underline"
          >
            Use this
          </button>
        )}
      </p>
    );
  };

  const numberField = (
    key: "callsAttended" | "callsAnswered" | "conversions",
    label: string
  ) => (
    <div className="space-y-1.5">
      <label htmlFor={`dr-${key}`} className={labelClass}>
        {label}
      </label>
      <input
        id={`dr-${key}`}
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        value={state[key]}
        onChange={(e) => set(key, e.target.value)}
        disabled={disabled}
        className={inputClass}
      />
      {errors[key] ? (
        <p className="font-body-sm text-[11px] text-error">{errors[key]}</p>
      ) : (
        systemHint(key)
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="dr-work" className={labelClass}>
          Work completed <span className="text-error">*</span>
        </label>
        <textarea
          id="dr-work"
          rows={4}
          maxLength={2000}
          value={state.workCompleted}
          onChange={(e) => set("workCompleted", e.target.value)}
          disabled={disabled}
          placeholder="What did you get done today?"
          className={`${inputClass} resize-y`}
        />
        {errors.workCompleted && (
          <p className="font-body-sm text-[11px] text-error">
            {errors.workCompleted}
          </p>
        )}
      </div>

      <div>
        <p className="mb-3 font-body-sm text-[11px] text-on-surface-variant">
          Call figures are pre-filled from the dialer and revenue records.
          Adjust them if you worked outside the CRM; managers see both values.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {numberField("callsAttended", "Calls attended")}
          {numberField("callsAnswered", "Calls answered")}
          {numberField("conversions", "Conversions")}

          <div className="space-y-1.5">
            <span className={labelClass}>Call duration</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={state.durationHours}
                onChange={(e) => set("durationHours", e.target.value)}
                disabled={disabled}
                aria-label="Call duration hours"
                className={inputClass}
              />
              <span className="text-xs text-on-surface-variant">h</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={59}
                value={state.durationMinutes}
                onChange={(e) => set("durationMinutes", e.target.value)}
                disabled={disabled}
                aria-label="Call duration minutes"
                className={inputClass}
              />
              <span className="text-xs text-on-surface-variant">m</span>
            </div>
            {errors.duration ? (
              <p className="font-body-sm text-[11px] text-error">
                {errors.duration}
              </p>
            ) : (
              systemHint("totalCallDurationSeconds")
            )}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="dr-feedback" className={labelClass}>
          Daily feedback
        </label>
        <textarea
          id="dr-feedback"
          rows={3}
          maxLength={2000}
          value={state.dailyFeedback}
          onChange={(e) => set("dailyFeedback", e.target.value)}
          disabled={disabled}
          placeholder="Blockers, customer feedback, anything management should know"
          className={`${inputClass} resize-y`}
        />
      </div>

      <CustomFieldsEditor
        fields={state.customFields}
        onChange={(fields) => set("customFields", fields)}
        disabled={disabled}
        error={errors.customFields}
      />

      {!disabled && (
        <div className="flex justify-end border-t border-outline-variant/20 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 font-label-md text-xs font-bold text-on-primary shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <span className="material-symbols-outlined text-base">send</span>
            {isSubmitting
              ? "Saving…"
              : report
                ? "Update report"
                : "Submit report"}
          </button>
        </div>
      )}
    </form>
  );
};

export default DailyReportForm;
