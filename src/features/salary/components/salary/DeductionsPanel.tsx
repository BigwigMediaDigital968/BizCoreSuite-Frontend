import { useState } from "react";

import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Pager from "@/features/dailyReports/components/Pager";
import { useEmployeesQuery } from "@/features/employees/hooks/useEmployees";
import { formatDate, todayInput } from "@/utils/Date";
import type {
  Decision,
  SalaryDeduction,
  SalaryDeductionSource,
  SalaryDeductionStatus,
} from "@/types/salary";
import {
  useCreateDeduction,
  useDeductions,
  useDeleteDeduction,
  useReviewDeduction,
} from "../../hooks/useSalary";
import { controlClass, days, inr } from "../../utils";

const PAGE_SIZE = 20;

const STATUS_STYLES: Record<SalaryDeductionStatus, string> = {
  pending: "bg-amber-500/15 text-amber-700",
  approved: "bg-error/10 text-error",
  rejected: "bg-on-surface-variant/10 text-on-surface-variant",
};

const SOURCE_LABELS: Record<SalaryDeductionSource, string> = {
  manual: "Manual",
  late_rule: "Late rule",
  absence: "Absence",
};

const RaiseDeductionModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [search, setSearch] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState(todayInput());
  const [mode, setMode] = useState<"amount" | "days">("amount");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const create = useCreateDeduction();

  const { data } = useEmployeesQuery({ search: search || undefined, isActive: true, limit: 50 });
  const employees = (data?.employees ?? []).filter((e) => e.role !== "head");

  const parsed = Number(value);
  const valid =
    employeeId &&
    date &&
    reason.trim() &&
    Number.isFinite(parsed) &&
    (mode === "amount" ? parsed > 0 : parsed >= 0.5);

  const submit = () => {
    if (!valid) return;
    create.mutate(
      {
        employeeId,
        date,
        reason: reason.trim(),
        ...(mode === "amount" ? { amount: parsed } : { days: parsed }),
      },
      { onSuccess: onClose }
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record a deduction"
      description="It stays pending until approved, here or in the payout preview."
    >
      <div className="space-y-4">
        <label className="block space-y-1.5">
          <span className="block text-xs font-medium text-on-surface-variant">Employee</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className={`${controlClass} w-full`}
          />
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className={`${controlClass} w-full`}
            size={Math.min(6, Math.max(2, employees.length))}
            aria-label="Employee"
          >
            {employees.map((e) => (
              <option key={e._id} value={e._id}>
                {e.name} · {e.email}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="block text-xs font-medium text-on-surface-variant">Date it applies to</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${controlClass} w-full`} />
          </label>
          <div className="space-y-1.5">
            <span className="block text-xs font-medium text-on-surface-variant">
              {mode === "amount" ? "Amount (₹)" : "Days (at the per-day rate)"}
            </span>
            <div className="flex gap-1.5">
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as "amount" | "days")}
                aria-label="Deduct by"
                className={controlClass}
              >
                <option value="amount">₹</option>
                <option value="days">Days</option>
              </select>
              <input
                type="number"
                min={mode === "amount" ? 1 : 0.5}
                step={mode === "amount" ? "0.01" : "0.5"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                aria-label={mode === "amount" ? "Amount" : "Days"}
                className={`${controlClass} min-w-0 flex-1`}
              />
            </div>
          </div>
        </div>

        <label className="block space-y-1.5">
          <span className="block text-xs font-medium text-on-surface-variant">Reason</span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            rows={3}
            className={`${controlClass} w-full resize-none`}
          />
        </label>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container">
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!valid || create.isPending}
            className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-on-primary shadow-sm disabled:opacity-40"
          >
            {create.isPending ? "Saving…" : "Record deduction"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

const ReviewDeductionModal = ({
  deduction,
  decision,
  onClose,
}: {
  deduction: SalaryDeduction;
  decision: Decision;
  onClose: () => void;
}) => {
  const [remark, setRemark] = useState("");
  const review = useReviewDeduction();

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={decision === "approved" ? "Approve deduction" : "Reject deduction"}
      description={`${deduction.employee?.name ?? "Employee"} · ${formatDate(deduction.date)} · ${
        deduction.amount != null ? inr(deduction.amount) : `${days(deduction.days)} day(s)`
      }`}
    >
      <div className="space-y-4">
        <p className="text-xs text-on-surface">{deduction.reason}</p>
        <textarea
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="Remark (optional)"
          className={`${controlClass} w-full resize-none`}
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container">
            Cancel
          </button>
          <button
            type="button"
            disabled={review.isPending}
            onClick={() =>
              review.mutate({ id: deduction._id, status: decision, remark }, { onSuccess: onClose })
            }
            className={`rounded-xl px-5 py-2.5 text-xs font-bold text-on-primary shadow-sm disabled:opacity-40 ${
              decision === "approved" ? "bg-primary" : "bg-error"
            }`}
          >
            {decision === "approved" ? "Approve" : "Reject"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

const DeductionsPanel = () => {
  const [status, setStatus] = useState<SalaryDeductionStatus | "">("pending");
  const [page, setPage] = useState(1);
  const [raiseOpen, setRaiseOpen] = useState(false);
  const [reviewing, setReviewing] = useState<{ deduction: SalaryDeduction; decision: Decision } | null>(null);
  const [deleting, setDeleting] = useState<SalaryDeduction | null>(null);
  const remove = useDeleteDeduction();

  const { data, isLoading, isError } = useDeductions({
    status: status || undefined,
    page,
    limit: PAGE_SIZE,
  });
  const deductions = data?.deductions ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as SalaryDeductionStatus | "");
            setPage(1);
          }}
          aria-label="Filter by status"
          className={controlClass}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <button
          type="button"
          onClick={() => setRaiseOpen(true)}
          className="ml-auto flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-on-primary shadow-sm hover:bg-primary/90"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Record deduction
        </button>
      </div>

      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-low/50 text-[11px] uppercase tracking-wider text-on-surface-variant/70">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-xs text-on-surface">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="py-3.5 px-4">
                      <div className="h-6 rounded-lg bg-surface-container-high animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="py-10 px-4 text-center text-on-surface-variant">Failed to load deductions.</td>
                </tr>
              ) : deductions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 px-4 text-center text-on-surface-variant">No deductions.</td>
                </tr>
              ) : (
                deductions.map((d) => (
                  <tr key={d._id} className="align-top">
                    <td className="py-3.5 px-4">
                      <p className="font-bold">{d.employee?.name ?? "—"}</p>
                      <p className="text-[11px] text-on-surface-variant/70">
                        {d.raisedBy ? `Raised by ${d.raisedBy.name}` : "System"}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">{formatDate(d.date)}</td>
                    <td className="py-3.5 px-4">{SOURCE_LABELS[d.source]}</td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="line-clamp-2">{d.reason}</p>
                      {d.reviewRemark && <p className="text-[11px] text-on-surface-variant">“{d.reviewRemark}”</p>}
                    </td>
                    <td className="py-3.5 px-4 text-right tabular-nums whitespace-nowrap">
                      {d.amount != null && d.source === "manual" ? inr(d.amount) : `${days(d.days)} day(s)`}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold capitalize ${STATUS_STYLES[d.status]}`}>
                        {d.status}
                      </span>
                      {d.payout && <p className="mt-1 text-[11px] text-on-surface-variant">In {d.payout.payoutNo}</p>}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex justify-end gap-1">
                        {d.status === "pending" && !d.payout && (
                          <>
                            <button
                              type="button"
                              onClick={() => setReviewing({ deduction: d, decision: "approved" })}
                              className="rounded-lg px-2 py-1 text-[11px] font-bold text-primary hover:bg-primary/10"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => setReviewing({ deduction: d, decision: "rejected" })}
                              className="rounded-lg px-2 py-1 text-[11px] font-bold text-on-surface-variant hover:bg-surface-container"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {d.source === "manual" && d.status !== "approved" && !d.payout && (
                          <button
                            type="button"
                            onClick={() => setDeleting(d)}
                            aria-label="Delete deduction"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-on-surface-variant/60 hover:bg-error/10 hover:text-error"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pager pagination={data?.pagination} noun="deductions" onPageChange={setPage} />
      </div>

      {raiseOpen && <RaiseDeductionModal open onClose={() => setRaiseOpen(false)} />}
      {reviewing && (
        <ReviewDeductionModal
          deduction={reviewing.deduction}
          decision={reviewing.decision}
          onClose={() => setReviewing(null)}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting._id, { onSuccess: () => setDeleting(null) })}
        title="Delete deduction?"
        description="This can't be undone."
        confirmLabel="Delete"
        tone="danger"
        isLoading={remove.isPending}
      />
    </div>
  );
};

export default DeductionsPanel;
