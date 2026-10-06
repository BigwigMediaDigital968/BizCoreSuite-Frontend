export type SalaryPerDayBasis = "working_days" | "calendar_days" | "fixed_30";
export type MissedCheckoutPolicy = "full_day" | "half_day";
export type StatutoryProration = "prorate" | "full_if_any_payable_day";
export type SalaryPayoutStatus = "generated" | "paid" | "cancelled";
export type SalaryDeductionStatus = "pending" | "approved" | "rejected";
export type SalaryDeductionSource = "late_rule" | "absence" | "manual";
export type Decision = "approved" | "rejected";
export type ExportFormat = "csv" | "excel";

export interface SalarySettingsValues {
  perDayBasis: SalaryPerDayBasis;
  lateRule: {
    enabled: boolean;
    freeLatesPerMonth: number;
    everyNLates: number;
    deductionDays: number;
    severeLateMinutes: number | null;
  };
  halfDayRule: {
    enabled: boolean;
    minWorkingMinutes: number | null;
  };
  missedCheckoutPolicy: MissedCheckoutPolicy;
  absenceRequiresApproval: boolean;
  statutoryProration: StatutoryProration;
}

export interface SalarySettings extends SalarySettingsValues {
  /** true when nothing is saved and the built-in defaults apply. */
  isDefault: boolean;
  updatedAt?: string;
}

interface NamedRef {
  _id: string;
  name: string;
  email?: string;
}

export interface BranchRefLite {
  _id: string;
  name: string;
  code: string;
}

export interface EligibleEmployee {
  _id: string;
  name: string;
  email: string;
  role: string;
  employeeCode: string;
  designation: string | null;
  branch: BranchRefLite | null;
  joiningDate: string | null;
  grossSalary: number;
  hasSalary: boolean;
  overlappingPayout: { _id: string; payoutNo: string } | null;
  selectable: boolean;
  disabledReason: string | null;
}

export const EARNING_FIELDS = [
  "basic",
  "hra",
  "conveyance",
  "medicalAllowance",
  "specialAllowance",
  "otherAllowance",
] as const;

export const DEDUCTION_FIELDS = [
  "lop",
  "lateRule",
  "manual",
  "pf",
  "esi",
  "professionalTax",
  "other",
] as const;

export type EarningField = (typeof EARNING_FIELDS)[number];
export type DeductionField = (typeof DEDUCTION_FIELDS)[number];
export type OverrideField =
  | `earnings.${EarningField}`
  | `deductions.${DeductionField}`
  | "net";

export const FIELD_LABELS: Record<EarningField | DeductionField, string> = {
  basic: "Basic",
  hra: "HRA",
  conveyance: "Conveyance",
  medicalAllowance: "Medical allowance",
  specialAllowance: "Special allowance",
  otherAllowance: "Other allowance",
  lop: "Loss of pay",
  lateRule: "Late penalty",
  manual: "Manual deductions",
  pf: "PF",
  esi: "ESI",
  professionalTax: "Professional tax",
  other: "Other deductions",
};

export interface PayoutAdjustment {
  label: string;
  amount: number;
  note?: string;
}

export interface OverrideInput {
  field: OverrideField;
  value: number;
  reason: string;
}

export interface PayoutOverride extends OverrideInput {
  calculated: number;
}

export interface PayoutSuggestion {
  key: string;
  type: SalaryDeductionSource;
  date: string;
  days: number;
  amount: number;
  description: string;
  decision: Decision;
}

export interface PayoutManualDeduction {
  _id: string;
  date: string;
  reason: string;
  amount: number | null;
  days: number | null;
  computedAmount: number;
  status: SalaryDeductionStatus;
  decision: Decision | "pending";
}

export interface PayoutDays {
  calendar: number;
  notEmployed: number;
  entitled: number;
  working: number;
  holidays: number;
  weekOffs: number;
  present: number;
  late: number;
  halfDay: number;
  paidLeave: number;
  unpaidLeave: number;
  absent: number;
  excused: number;
  lop: number;
  payable: number;
}

export interface PayoutLine {
  employee: string;
  employeeCode: string;
  name: string;
  email: string;
  designation?: string;
  branch: BranchRefLite | null;
  salarySnapshot: Record<string, number>;
  days: PayoutDays;
  lateCount: number;
  perDayRate: number;
  earnings: Record<EarningField | "gross", number>;
  deductions: Record<DeductionField | "total", number>;
  suggestions: PayoutSuggestion[];
  manualDeductions: PayoutManualDeduction[];
  adjustments: PayoutAdjustment[];
  overrides: PayoutOverride[];
  calculatedNet: number;
  net: number;
  warnings: string[];
}

export interface PayoutTotals {
  employees: number;
  gross: number;
  deductions: number;
  adjustments: number;
  net: number;
  overriddenLines: number;
}

export interface PayoutPreview {
  from: string;
  to: string;
  settings: SalarySettings;
  totals: PayoutTotals;
  lines: PayoutLine[];
}

export interface PayoutInput {
  from: string;
  to: string;
  employeeIds: string[];
  adjustments: Record<string, PayoutAdjustment[]>;
  overrides: Record<string, OverrideInput[]>;
  suggestionDecisions: Record<string, Record<string, Decision>>;
  deductionDecisions: Record<string, Decision>;
}

export interface SalaryPayoutSummary {
  _id: string;
  payoutNo: string;
  from: string;
  to: string;
  status: SalaryPayoutStatus;
  generatedBy: NamedRef | null;
  generatedAt: string;
  paidAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  settingsSnapshot: SalarySettings;
  totals: PayoutTotals;
}

export interface SalaryPayout extends SalaryPayoutSummary {
  paidBy?: NamedRef | null;
  cancelledBy?: NamedRef | null;
  lines: PayoutLine[];
}

export interface PayoutListQuery {
  status?: SalaryPayoutStatus;
  page?: number;
  limit?: number;
}

export interface SalaryDeduction {
  _id: string;
  employee: NamedRef | null;
  date: string;
  source: SalaryDeductionSource;
  amount: number | null;
  days: number | null;
  reason: string;
  status: SalaryDeductionStatus;
  raisedBy: NamedRef | null;
  reviewedBy: NamedRef | null;
  reviewedAt: string | null;
  reviewRemark: string | null;
  payout: { _id: string; payoutNo: string; status: SalaryPayoutStatus } | null;
  createdAt: string;
}

export interface DeductionListQuery {
  status?: SalaryDeductionStatus;
  employeeId?: string;
  page?: number;
  limit?: number;
}

export interface CreateDeductionPayload {
  employeeId: string;
  date: string;
  amount?: number;
  days?: number;
  reason: string;
}

// ---------- Employee self-service ----------

export interface MyPayoutSummary {
  _id: string;
  payoutNo: string;
  from: string;
  to: string;
  status: Exclude<SalaryPayoutStatus, "cancelled">;
  generatedAt: string;
  paidAt?: string | null;
  gross: number;
  deductions: number;
  net: number;
}

export interface PayslipLine {
  employeeCode: string;
  name: string;
  designation: string | null;
  branch: BranchRefLite | null;
  monthlyGross: number;
  perDayRate: number;
  days: PayoutDays;
  lateCount: number;
  earnings: Record<EarningField | "gross", number>;
  deductions: Record<DeductionField | "total", number>;
  deductionItems: { date: string; description: string; amount: number }[];
  adjustments: { label: string; amount: number }[];
  net: number;
}

export interface Payslip extends Omit<MyPayoutSummary, "gross" | "deductions" | "net"> {
  line: PayslipLine;
}
