import type { InputHTMLAttributes, ReactNode } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  addon?: ReactNode;
}

const FormField = ({
  label,
  error,
  hint,
  addon,
  id,
  className,
  ...inputProps
}: FormFieldProps) => {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block font-label-md text-xs font-medium text-on-surface-variant"
      >
        {label}
      </label>
      <div
        className={`flex items-center rounded-xl border bg-surface-container-low px-3.5 py-2.5 transition-all focus-within:ring-2 ${
          error
            ? "border-error focus-within:border-error focus-within:ring-error/20"
            : "border-outline-variant/40 focus-within:border-primary focus-within:ring-primary/20"
        }`}
      >
        {addon}
        <input
          id={id}
          className={`w-full bg-transparent font-body-md text-sm text-on-surface outline-none placeholder:text-on-surface-variant/40 ${
            className ?? ""
          }`}
          {...inputProps}
        />
      </div>
      {error ? (
        <p className="font-body-sm text-[11px] text-error">{error}</p>
      ) : hint ? (
        <p className="font-body-sm text-[11px] text-on-surface-variant/70">
          {hint}
        </p>
      ) : null}
    </div>
  );
};

export default FormField;
