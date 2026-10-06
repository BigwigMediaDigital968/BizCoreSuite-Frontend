import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import { todayInput } from "@/utils/Date";
import {
  LEAVE_DURATION_TYPE,
  LEAVE_DURATION_TYPE_LABELS,
  LEAVE_TYPE_LABELS,
  type LeaveDurationType,
  type LeavePolicy,
} from "@/types/leave";
import { useCreateLeaveRequest, useLeavePolicies } from "../hooks/useLeave";

interface ApplyLeaveModalProps {
  open: boolean;
  onClose: () => void;
}

const EMPTY_FORM = {
  leavePolicyId: "",
  startDate: todayInput(),
  endDate: todayInput(),
  durationType: LEAVE_DURATION_TYPE.FULL_DAY as LeaveDurationType,
  reason: "",
};

const ApplyLeaveModal = ({ open, onClose }: ApplyLeaveModalProps) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  // Only active policies can be applied against.
  const { data: policyData, isLoading: policiesLoading } = useLeavePolicies({
    isActive: "true",
    limit: 100,
  });

  const policies = useMemo(
    () => policyData?.policies ?? [],
    [policyData]
  );

  const selectedPolicy: LeavePolicy | undefined = policies.find(
    (policy) => policy._id === form.leavePolicyId
  );

  const createLeave = useCreateLeaveRequest();

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setError("");
    }
  }, [open]);

  // A half-day request only makes sense on a single date.
  const isHalfDay = form.durationType !== LEAVE_DURATION_TYPE.FULL_DAY;

  const setField = <K extends keyof typeof EMPTY_FORM>(
    key: K,
    value: (typeof EMPTY_FORM)[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!selectedPolicy) {
      setError("Select a leave policy");
      return;
    }
    if (form.endDate < form.startDate) {
      setError("End date cannot be before start date");
      return;
    }
    if (isHalfDay && form.startDate !== form.endDate) {
      setError("A half-day request must start and end on the same date");
      return;
    }
    if (isHalfDay && !selectedPolicy.allowHalfDay) {
      setError(`${selectedPolicy.name} does not allow half-day leave`);
      return;
    }

    setError("");

    try {
      await createLeave.mutateAsync({
        leavePolicyId: form.leavePolicyId,
        // The backend uppercases this and matches it against the balance row.
        leaveType: selectedPolicy.leaveType,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        durationType: form.durationType,
        reason: form.reason.trim() || undefined,
      });
      onClose();
    } catch {
      // Surfaced by the mutation's error toast.
    }
  };

  return (
    <Modal title="Apply for Leave" open={open} onClose={onClose} size="md">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="block font-label-md text-xs font-medium text-on-surface-variant">
            Leave Policy <span className="text-error">*</span>
          </label>
          <select
            value={form.leavePolicyId}
            onChange={(e) => setField("leavePolicyId", e.target.value)}
            disabled={policiesLoading}
            className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary disabled:opacity-50"
          >
            <option value="">
              {policiesLoading ? "Loading policies…" : "Select a policy"}
            </option>
            {policies.map((policy) => (
              <option key={policy._id} value={policy._id}>
                {policy.name} ({LEAVE_TYPE_LABELS[policy.leaveType]})
              </option>
            ))}
          </select>

          {!policiesLoading && policies.length === 0 && (
            <p className="font-body-sm text-[11px] text-error">
              No active leave policies exist yet. An administrator needs to
              create one before leave can be requested.
            </p>
          )}
        </div>

        {selectedPolicy && (
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-3 space-y-1">
            <p className="font-body-sm text-[11px] text-on-surface-variant">
              <span className="font-bold text-on-surface">
                {selectedPolicy.annualAllocation}
              </span>{" "}
              days allocated annually ·{" "}
              {selectedPolicy.isPaid ? "Paid" : "Unpaid"} ·{" "}
              {selectedPolicy.allowHalfDay ? "Half-day allowed" : "Full days only"}
            </p>
            {selectedPolicy.minimumNoticeDays > 0 && (
              <p className="font-body-sm text-[11px] text-on-surface-variant">
                Requires {selectedPolicy.minimumNoticeDays} day(s) notice.
              </p>
            )}
            {selectedPolicy.maximumConsecutiveDays && (
              <p className="font-body-sm text-[11px] text-on-surface-variant">
                Maximum {selectedPolicy.maximumConsecutiveDays} consecutive days.
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block font-label-md text-xs font-medium text-on-surface-variant">
              Start Date <span className="text-error">*</span>
            </label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => {
                const startDate = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  startDate,
                  // Keep the range valid, and pin half-days to one date.
                  endDate:
                    prev.durationType !== LEAVE_DURATION_TYPE.FULL_DAY ||
                    prev.endDate < startDate
                      ? startDate
                      : prev.endDate,
                }));
              }}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-label-md text-xs font-medium text-on-surface-variant">
              End Date <span className="text-error">*</span>
            </label>
            <input
              type="date"
              value={form.endDate}
              min={form.startDate}
              disabled={isHalfDay}
              onChange={(e) => setField("endDate", e.target.value)}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary disabled:opacity-50"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block font-label-md text-xs font-medium text-on-surface-variant">
            Duration <span className="text-error">*</span>
          </label>
          <div className="flex rounded-xl bg-surface-container-low p-1">
            {Object.values(LEAVE_DURATION_TYPE).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    durationType: value,
                    endDate:
                      value === LEAVE_DURATION_TYPE.FULL_DAY
                        ? prev.endDate
                        : prev.startDate,
                  }))
                }
                className={`flex-1 rounded-lg px-3 py-1.5 font-label-sm text-xs font-bold transition-all ${
                  form.durationType === value
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {LEAVE_DURATION_TYPE_LABELS[value]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block font-label-md text-xs font-medium text-on-surface-variant">
            Reason
          </label>
          <textarea
            rows={3}
            value={form.reason}
            maxLength={2000}
            placeholder="Optional context for your approver"
            onChange={(e) => setField("reason", e.target.value)}
            className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary resize-none"
          />
        </div>

        {error && (
          <p className="font-body-sm text-xs text-error">{error}</p>
        )}

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
            disabled={createLeave.isPending || !form.leavePolicyId}
            className="rounded-xl bg-primary px-5 py-2 font-label-md text-xs font-bold text-on-primary hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {createLeave.isPending ? "Submitting…" : "Submit Request"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ApplyLeaveModal;
