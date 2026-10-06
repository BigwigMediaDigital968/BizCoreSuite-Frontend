import type { SalaryStructure } from "@/types/employee";

interface SalarySectionProps {
  salary: SalaryStructure;
  onChange: (next: SalaryStructure) => void;
  disabled?: boolean;
}

/**
 * Earnings + deductions grid with live gross/net auto-calculation so the
 * admin doesn't have to do the math in their head. Backend still re-validates
 * before persisting — this is purely a UX affordance.
 */
const num = (v: number) => (Number.isFinite(v) ? v : 0);

export function calcGross(s: SalaryStructure): number {
  return (
    num(s.basic) +
    num(s.hra) +
    num(s.conveyance) +
    num(s.medicalAllowance) +
    num(s.specialAllowance) +
    num(s.otherAllowance)
  );
}

export function calcNet(s: SalaryStructure): number {
  return (
    calcGross(s) -
    num(s.pfDeduction) -
    num(s.esiDeduction) -
    num(s.professionalTax) -
    num(s.otherDeduction)
  );
}

interface NumberFieldProps {
  id: string;
  label: string;
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}

const NumberField = ({ id, label, value, onChange, disabled }: NumberFieldProps) => (
  <div className="space-y-1.5">
    <label
      htmlFor={id}
      className="block font-label-md text-xs font-medium text-on-surface-variant"
    >
      {label}
    </label>
    <div
      className={`relative flex items-center rounded-xl border bg-surface-container-low px-3.5 py-2.5 focus-within:ring-2 transition-all ${disabled
        ? "border-outline-variant/20 opacity-60"
        : "border-outline-variant/40 focus-within:border-primary focus-within:ring-primary/20"
        }`}
    >
      <span className="material-symbols-outlined text-xl text-on-surface-variant/60 mr-2.5">
        payments
      </span>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="w-full bg-transparent font-body-md text-sm text-on-surface outline-none placeholder:text-on-surface-variant/40"
      />
    </div>
  </div>
);

const SummaryTile = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "positive" | "negative";
}) => {
  const palette =
    tone === "positive"
      ? "bg-emerald-500/10 text-emerald-700"
      : tone === "negative"
        ? "bg-error/10 text-error"
        : "bg-primary/10 text-primary";
  return (
    <div className={`rounded-xl border border-outline-variant/30 px-4 py-3 ${palette}`}>
      <p className="font-label-sm text-[10px] uppercase tracking-wider opacity-80">
        {label}
      </p>
      <p className="font-headline-sm text-lg font-extrabold">
        ₹{value.toLocaleString("en-IN")}
      </p>
    </div>
  );
};

const SalarySection = ({ salary, onChange, disabled }: SalarySectionProps) => {
  const handle = <K extends keyof SalaryStructure>(
    key: K,
    value: number
  ) => {
    const nextSalary = {
      ...salary,
      [key]: value,
    };

    const grossSalary = calcGross(nextSalary);

    const totalDeductions =
      num(nextSalary.pfDeduction) +
      num(nextSalary.esiDeduction) +
      num(nextSalary.professionalTax) +
      num(nextSalary.otherDeduction);

    const netSalary = Math.max(0, grossSalary - totalDeductions);

    onChange({
      ...nextSalary,
      grossSalary,
      netSalary,
    });
  };

  const gross = calcGross(salary);
  const totalDeductions =
    num(salary.pfDeduction) +
    num(salary.esiDeduction) +
    num(salary.professionalTax) +
    num(salary.otherDeduction);
  const net = Math.max(0, gross - totalDeductions);



  return (
    <div className="space-y-5">
      {/* Earnings */}
      <div className="space-y-3">
        <p className="font-label-md text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
          Earnings
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NumberField
            id="salary-basic"
            label="Basic"
            value={salary.basic}
            onChange={(n) => handle("basic", n)}
            disabled={disabled}
          />
          <NumberField
            id="salary-hra"
            label="HRA"
            value={salary.hra}
            onChange={(n) => handle("hra", n)}
            disabled={disabled}
          />
          <NumberField
            id="salary-conveyance"
            label="Conveyance"
            value={salary.conveyance}
            onChange={(n) => handle("conveyance", n)}
            disabled={disabled}
          />
          <NumberField
            id="salary-medical"
            label="Medical Allowance"
            value={salary.medicalAllowance}
            onChange={(n) => handle("medicalAllowance", n)}
            disabled={disabled}
          />
          <NumberField
            id="salary-special"
            label="Special Allowance"
            value={salary.specialAllowance}
            onChange={(n) => handle("specialAllowance", n)}
            disabled={disabled}
          />
          <NumberField
            id="salary-other-allowance"
            label="Other Allowance"
            value={salary.otherAllowance}
            onChange={(n) => handle("otherAllowance", n)}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Deductions */}
      <div className="space-y-3">
        <p className="font-label-md text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
          Deductions
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NumberField
            id="salary-pf"
            label="PF Deduction"
            value={salary.pfDeduction}
            onChange={(n) => handle("pfDeduction", n)}
            disabled={disabled}
          />
          <NumberField
            id="salary-esi"
            label="ESI Deduction"
            value={salary.esiDeduction}
            onChange={(n) => handle("esiDeduction", n)}
            disabled={disabled}
          />
          <NumberField
            id="salary-pt"
            label="Professional Tax"
            value={salary.professionalTax}
            onChange={(n) => handle("professionalTax", n)}
            disabled={disabled}
          />
          <NumberField
            id="salary-other-deduction"
            label="Other Deduction"
            value={salary.otherDeduction}
            onChange={(n) => handle("otherDeduction", n)}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Live summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <SummaryTile label="Gross" value={gross} tone="neutral" />
        <SummaryTile label="Deductions" value={totalDeductions} tone="negative" />
        <SummaryTile label="Net Take-Home" value={net} tone="positive" />
      </div>
      <p className="font-body-sm text-[11px] text-on-surface-variant/70">
        Gross & net are auto-calculated; backend re-validates and stores the
        final figures on save.
      </p>
    </div>
  );
};

export default SalarySection;
