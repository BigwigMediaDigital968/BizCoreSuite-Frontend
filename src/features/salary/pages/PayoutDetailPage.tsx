import { useState } from "react";
import { Link, useParams } from "react-router";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import { ROUTES } from "@/config/routes";
import type { ExportFormat } from "@/types/salary";
import PayoutLinesTable from "../components/salary/PayoutLinesTable";
import { useCancelPayout, useMarkPayoutPaid, usePayout } from "../hooks/useSalary";
import {
  controlClass,
  downloadPayout,
  formatDateTime,
  formatPeriod,
  inr,
  PAYOUT_STATUS_STYLES,
} from "../utils";

const PayoutDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: payout, isLoading, isError } = usePayout(id);
  const markPaid = useMarkPayoutPaid();
  const cancel = useCancelPayout();
  const [confirmPaid, setConfirmPaid] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [exporting, setExporting] = useState(false);

  const back = (
    <Link
      to={`${ROUTES.salary}?view=payouts`}
      className="inline-flex items-center gap-1 text-xs font-bold text-on-surface-variant hover:text-primary"
    >
      <span className="material-symbols-outlined text-base">arrow_back</span>
      Payouts
    </Link>
  );

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-4">
        {back}
        <div className="h-64 rounded-2xl bg-surface-container-high animate-pulse" />
      </div>
    );
  }

  if (isError || !payout) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-4">
        {back}
        <p className="py-10 text-center text-xs text-on-surface-variant">Payout not found.</p>
      </div>
    );
  }

  const style = PAYOUT_STATUS_STYLES[payout.status];

  const handleExport = async () => {
    setExporting(true);
    await downloadPayout(payout._id, format);
    setExporting(false);
  };

  return (
    <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="space-y-3 border-b border-outline-variant/30 pb-5">
        {back}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-headline-md text-2xl sm:text-3xl font-extrabold text-on-surface">
                {payout.payoutNo}
              </h1>
              <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${style.className}`}>
                {style.label}
              </span>
              {payout.settingsSnapshot.isDefault && (
                <span className="rounded-md bg-surface-container-high px-2 py-0.5 text-[11px] font-bold text-on-surface-variant">
                  Default rules
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-on-surface-variant">
              {formatPeriod(payout.from, payout.to)} · generated {formatDateTime(payout.generatedAt)}
              {payout.generatedBy && ` by ${payout.generatedBy.name}`}
            </p>
            {payout.status === "paid" && (
              <p className="text-xs text-emerald-700">
                Paid {formatDateTime(payout.paidAt)}
                {payout.paidBy && ` by ${payout.paidBy.name}`}
              </p>
            )}
            {payout.status === "cancelled" && (
              <p className="text-xs text-on-surface-variant">
                Cancelled {formatDateTime(payout.cancelledAt)}
                {payout.cancelledBy && ` by ${payout.cancelledBy.name}`}
                {payout.cancelReason && `: “${payout.cancelReason}”`}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)} aria-label="Export format" className={controlClass}>
              <option value="csv">CSV</option>
              <option value="excel">Excel</option>
            </select>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-2 text-xs font-bold text-on-surface hover:bg-surface-container disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">download</span>
              {exporting ? "Exporting…" : "Export"}
            </button>
            {payout.status === "generated" && (
              <>
                <button
                  type="button"
                  onClick={() => setCancelOpen(true)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-error hover:bg-error/10"
                >
                  Cancel payout
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmPaid(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary shadow-sm"
                >
                  <span className="material-symbols-outlined text-base">task_alt</span>
                  Mark paid
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Employees", value: String(payout.totals.employees) },
          { label: "Gross", value: inr(payout.totals.gross) },
          { label: "Deductions", value: inr(payout.totals.deductions) },
          { label: "Net payout", value: inr(payout.totals.net) },
        ].map((t) => (
          <div key={t.label} className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm">
            <p className="text-[11px] text-on-surface-variant">{t.label}</p>
            <p className="text-xl font-extrabold tabular-nums text-on-surface">{t.value}</p>
          </div>
        ))}
      </div>

      {payout.totals.overriddenLines > 0 && (
        <p className="text-xs text-amber-800">
          {payout.totals.overriddenLines} employee{payout.totals.overriddenLines === 1 ? " has" : "s have"} manually
          edited amounts. Expand a row to see the calculated value, the final value and the reason.
        </p>
      )}

      <PayoutLinesTable lines={payout.lines} totals={payout.totals} />

      <ConfirmDialog
        open={confirmPaid}
        onClose={() => setConfirmPaid(false)}
        onConfirm={() => markPaid.mutate(payout._id, { onSuccess: () => setConfirmPaid(false) })}
        title="Mark this payout as paid?"
        description={`${inr(payout.totals.net)} to ${payout.totals.employees} employees. A paid payout can't be cancelled.`}
        confirmLabel="Mark paid"
        isLoading={markPaid.isPending}
      />

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        size="sm"
        title="Cancel this payout?"
        description="The employees and dates become available for a new payout, and recorded deductions are released."
      >
        <div className="space-y-4">
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Reason (required)"
            className={`${controlClass} w-full resize-none`}
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setCancelOpen(false)} className="rounded-xl px-4 py-2.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container">
              Keep payout
            </button>
            <button
              type="button"
              disabled={!cancelReason.trim() || cancel.isPending}
              onClick={() =>
                cancel.mutate(
                  { id: payout._id, reason: cancelReason.trim() },
                  { onSuccess: () => setCancelOpen(false) }
                )
              }
              className="rounded-xl bg-error px-5 py-2.5 text-xs font-bold text-on-primary shadow-sm disabled:opacity-40"
            >
              Cancel payout
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PayoutDetailPage;
