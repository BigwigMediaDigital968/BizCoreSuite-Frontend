import {
  DAILY_REPORT_MAX_CUSTOM_FIELDS,
  type DailyReportCustomField,
} from "@/types/dailyReport";

interface CustomFieldsEditorProps {
  fields: DailyReportCustomField[];
  onChange: (fields: DailyReportCustomField[]) => void;
  disabled?: boolean;
  error?: string;
}

const inputClass =
  "w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary disabled:opacity-60";

const CustomFieldsEditor = ({
  fields,
  onChange,
  disabled,
  error,
}: CustomFieldsEditorProps) => {
  const update = (index: number, patch: Partial<DailyReportCustomField>) =>
    onChange(fields.map((f, i) => (i === index ? { ...f, ...patch } : f)));

  const remove = (index: number) =>
    onChange(fields.filter((_, i) => i !== index));

  const add = () => onChange([...fields, { label: "", value: "" }]);

  const atLimit = fields.length >= DAILY_REPORT_MAX_CUSTOM_FIELDS;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-label-md text-xs font-bold text-on-surface">
            Additional fields
          </p>
          <p className="font-body-sm text-[11px] text-on-surface-variant">
            Anything else worth reporting today: meetings, demos, follow-ups.
          </p>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={add}
            disabled={atLimit}
            className="flex shrink-0 items-center gap-1 rounded-xl border border-primary/40 px-3 py-1.5 font-label-sm text-[11px] font-bold text-primary hover:bg-primary/10 disabled:opacity-40 transition-colors"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Add field
          </button>
        )}
      </div>

      {fields.length === 0 ? (
        <p className="rounded-xl border border-dashed border-outline-variant/40 px-4 py-3 text-center font-body-sm text-[11px] text-on-surface-variant/70">
          No additional fields.
        </p>
      ) : (
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div
              key={index}
              className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto]"
            >
              <input
                value={field.label}
                onChange={(e) => update(index, { label: e.target.value })}
                placeholder="Field name, e.g. Demos given"
                maxLength={60}
                disabled={disabled}
                aria-label={`Additional field ${index + 1} name`}
                className={inputClass}
              />
              <input
                value={field.value}
                onChange={(e) => update(index, { value: e.target.value })}
                placeholder="Value"
                maxLength={500}
                disabled={disabled}
                aria-label={`Additional field ${index + 1} value`}
                className={inputClass}
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`Remove additional field ${index + 1}`}
                  className="flex h-10 w-10 items-center justify-center self-center rounded-lg text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">
                    delete
                  </span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <p className="font-body-sm text-[11px] text-error">{error}</p>}
      {atLimit && !disabled && (
        <p className="font-body-sm text-[11px] text-on-surface-variant">
          Maximum of {DAILY_REPORT_MAX_CUSTOM_FIELDS} additional fields.
        </p>
      )}
    </div>
  );
};

export default CustomFieldsEditor;
