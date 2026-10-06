import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import { useBranchesQuery } from "@/features/branches";
import { todayInput } from "@/utils/Date";
import {
  LEAVE_TYPE,
  LEAVE_TYPE_LABELS,
  type LeavePolicy,
  type LeaveType,
} from "@/types/leave";
import { useCreateLeavePolicy, useUpdateLeavePolicy } from "../hooks/useLeave";

interface LeavePolicyFormModalProps {
  open: boolean;
  /** null = create mode. */
  policy: LeavePolicy | null;
  onClose: () => void;
}

interface FormState {
  name: string;
  code: string;
  branch: string;
  leaveType: LeaveType;
  annualAllocation: number;
  isPaid: boolean;
  allowHalfDay: boolean;
  allowCarryForward: boolean;
  maximumCarryForward: string;
  allowNegativeBalance: boolean;
  minimumNoticeDays: number;
  maximumConsecutiveDays: string;
  applicableFrom: string;
  applicableTo: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  code: "",
  branch: "",
  leaveType: LEAVE_TYPE.CASUAL,
  annualAllocation: 0,
  isPaid: true,
  allowHalfDay: true,
  allowCarryForward: false,
  maximumCarryForward: "",
  allowNegativeBalance: false,
  minimumNoticeDays: 0,
  maximumConsecutiveDays: "",
  applicableFrom: todayInput(),
  applicableTo: "",
  isActive: true,
};

const toDateInputValue = (value?: string | null) =>
  value ? new Date(value).toISOString().slice(0, 10) : "";

const toFormState = (policy: LeavePolicy): FormState => ({
  name: policy.name,
  code: policy.code,
  branch:
    typeof policy.branch === "object" && policy.branch
      ? policy.branch._id
      : (policy.branch as string) ?? "",
  leaveType: policy.leaveType,
  annualAllocation: policy.annualAllocation,
  isPaid: policy.isPaid,
  allowHalfDay: policy.allowHalfDay,
  allowCarryForward: policy.allowCarryForward,
  maximumCarryForward: policy.maximumCarryForward?.toString() ?? "",
  allowNegativeBalance: policy.allowNegativeBalance,
  minimumNoticeDays: policy.minimumNoticeDays,
  maximumConsecutiveDays: policy.maximumConsecutiveDays?.toString() ?? "",
  applicableFrom: toDateInputValue(policy.applicableFrom),
  applicableTo: toDateInputValue(policy.applicableTo),
  isActive: policy.isActive,
});

const Toggle = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="flex w-full items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-low px-3.5 py-2.5 transition-colors hover:bg-surface-container"
  >
    <span className="font-label-md text-xs font-bold text-on-surface">
      {label}
    </span>
    <span
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-emerald-600" : "bg-outline-variant/60"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </span>
  </button>
);

const LeavePolicyFormModal = ({
  open,
  policy,
  onClose,
}: LeavePolicyFormModalProps) => {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState("");

  const isEditMode = Boolean(policy);

  const { data: branches } = useBranchesQuery();
  const createPolicy = useCreateLeavePolicy();
  const updatePolicy = useUpdateLeavePolicy();

  const isSubmitting = createPolicy.isPending || updatePolicy.isPending;

  useEffect(() => {
    if (!open) return;
    setForm(policy ? toFormState(policy) : EMPTY_FORM);
    setError("");
  }, [open, policy]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (form.name.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }
    if (form.code.trim().length < 2) {
      setError("Code must be at least 2 characters");
      return;
    }
    if (!form.applicableFrom) {
      setError("Effective-from date is required");
      return;
    }
    if (form.applicableTo && form.applicableTo < form.applicableFrom) {
      setError("Effective-to date cannot be before effective-from");
      return;
    }

    setError("");

    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      // Empty select = org-wide policy, which the backend stores as null.
      branch: form.branch || null,
      leaveType: form.leaveType,
      annualAllocation: Number(form.annualAllocation),
      isPaid: form.isPaid,
      allowHalfDay: form.allowHalfDay,
      allowCarryForward: form.allowCarryForward,
      maximumCarryForward: form.maximumCarryForward
        ? Number(form.maximumCarryForward)
        : null,
      allowNegativeBalance: form.allowNegativeBalance,
      minimumNoticeDays: Number(form.minimumNoticeDays),
      maximumConsecutiveDays: form.maximumConsecutiveDays
        ? Number(form.maximumConsecutiveDays)
        : null,
      applicableFrom: new Date(form.applicableFrom).toISOString(),
      applicableTo: form.applicableTo
        ? new Date(form.applicableTo).toISOString()
        : null,
      isActive: form.isActive,
    };

    try {
      if (policy) {
        await updatePolicy.mutateAsync({ id: policy._id, payload });
      } else {
        await createPolicy.mutateAsync(payload);
      }
      onClose();
    } catch {
      // Surfaced by the mutation's error toast.
    }
  };

  return (
    <Modal
      title={isEditMode ? "Edit Leave Policy" : "Create Leave Policy"}
      open={open}
      onClose={onClose}
      size="lg"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block font-label-md text-xs font-medium text-on-surface-variant">
              Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              placeholder="e.g. Casual Leave 2026"
              onChange={(e) => setField("name", e.target.value)}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-label-md text-xs font-medium text-on-surface-variant">
              Code <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={form.code}
              placeholder="e.g. CL-2026"
              onChange={(e) => setField("code", e.target.value.toUpperCase())}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-label-md text-xs font-medium text-on-surface-variant">
              Leave Type <span className="text-error">*</span>
            </label>
            <select
              value={form.leaveType}
              onChange={(e) => setField("leaveType", e.target.value as LeaveType)}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
            >
              {Object.values(LEAVE_TYPE).map((value) => (
                <option key={value} value={value}>
                  {LEAVE_TYPE_LABELS[value]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block font-label-md text-xs font-medium text-on-surface-variant">
              Branch
            </label>
            <select
              value={form.branch}
              onChange={(e) => setField("branch", e.target.value)}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
            >
              <option value="">All branches</option>
              {(branches ?? []).map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block font-label-md text-xs font-medium text-on-surface-variant">
              Annual Allocation (days) <span className="text-error">*</span>
            </label>
            <input
              type="number"
              min={0}
              value={form.annualAllocation}
              onChange={(e) =>
                setField("annualAllocation", Number(e.target.value))
              }
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-label-md text-xs font-medium text-on-surface-variant">
              Minimum Notice (days)
            </label>
            <input
              type="number"
              min={0}
              value={form.minimumNoticeDays}
              onChange={(e) =>
                setField("minimumNoticeDays", Number(e.target.value))
              }
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-label-md text-xs font-medium text-on-surface-variant">
              Effective From <span className="text-error">*</span>
            </label>
            <input
              type="date"
              value={form.applicableFrom}
              onChange={(e) => setField("applicableFrom", e.target.value)}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-label-md text-xs font-medium text-on-surface-variant">
              Effective To
            </label>
            <input
              type="date"
              value={form.applicableTo}
              min={form.applicableFrom}
              onChange={(e) => setField("applicableTo", e.target.value)}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
            />
            <p className="font-body-sm text-[11px] text-on-surface-variant/70">
              Leave blank for an ongoing policy.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block font-label-md text-xs font-medium text-on-surface-variant">
              Max Carry Forward (days)
            </label>
            <input
              type="number"
              min={0}
              value={form.maximumCarryForward}
              disabled={!form.allowCarryForward}
              placeholder="No limit"
              onChange={(e) => setField("maximumCarryForward", e.target.value)}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-label-md text-xs font-medium text-on-surface-variant">
              Max Consecutive Days
            </label>
            <input
              type="number"
              min={1}
              value={form.maximumConsecutiveDays}
              placeholder="No limit"
              onChange={(e) =>
                setField("maximumConsecutiveDays", e.target.value)
              }
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Toggle
            label="Paid leave"
            checked={form.isPaid}
            onChange={(value) => setField("isPaid", value)}
          />
          <Toggle
            label="Allow half-day"
            checked={form.allowHalfDay}
            onChange={(value) => setField("allowHalfDay", value)}
          />
          <Toggle
            label="Allow carry forward"
            checked={form.allowCarryForward}
            onChange={(value) => setField("allowCarryForward", value)}
          />
          <Toggle
            label="Allow negative balance"
            checked={form.allowNegativeBalance}
            onChange={(value) => setField("allowNegativeBalance", value)}
          />
          <Toggle
            label="Active"
            checked={form.isActive}
            onChange={(value) => setField("isActive", value)}
          />
        </div>

        {error && <p className="font-body-sm text-xs text-error">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-outline-variant/40 px-4 py-2 font-label-md text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-xl bg-primary px-5 py-2 font-label-md text-xs font-bold text-on-primary hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isSubmitting
              ? "Saving…"
              : isEditMode
                ? "Save Changes"
                : "Create Policy"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default LeavePolicyFormModal;
