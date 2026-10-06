import { useState } from "react";
import { Link, useNavigate } from "react-router";

import Pager from "@/features/dailyReports/components/Pager";
import { ROUTES } from "@/config/routes";
import type { SalaryPayoutStatus } from "@/types/salary";
import { usePayouts } from "../../hooks/useSalary";
import {
  controlClass,
  formatDateTime,
  formatPeriod,
  inr,
  PAYOUT_STATUS_STYLES,
} from "../../utils";

const PAGE_SIZE = 20;

const PayoutList = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<SalaryPayoutStatus | "">("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = usePayouts({
    status: status || undefined,
    page,
    limit: PAGE_SIZE,
  });
  const payouts = data?.payouts ?? [];

  const openPayout = (id: string) => navigate(ROUTES.payoutDetail.replace(":id", id));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as SalaryPayoutStatus | "");
            setPage(1);
          }}
          aria-label="Filter by status"
          className={controlClass}
        >
          <option value="">All statuses</option>
          <option value="generated">Generated</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <Link
          to={ROUTES.payoutNew}
          className="ml-auto flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 font-label-md text-xs font-bold text-on-primary shadow-sm hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined text-base">payments</span>
          Generate payout
        </Link>
      </div>

      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-low/50 font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant/70">
                <th className="py-3 px-4">Payout</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Employees</th>
                <th className="py-3 px-4 text-right">Gross</th>
                <th className="py-3 px-4 text-right">Deductions</th>
                <th className="py-3 px-4 text-right">Net</th>
                <th className="py-3 px-4">Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 font-body-sm text-xs text-on-surface">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="py-3.5 px-4">
                      <div className="h-6 rounded-lg bg-surface-container-high animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={8} className="py-10 px-4 text-center text-on-surface-variant">
                    Failed to load payouts.
                  </td>
                </tr>
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 px-4 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined mb-1 block text-3xl text-on-surface-variant/50">
                      payments
                    </span>
                    No payouts yet. Use <b>Generate payout</b> to create the first one.
                  </td>
                </tr>
              ) : (
                payouts.map((p) => {
                  const style = PAYOUT_STATUS_STYLES[p.status];
                  return (
                    <tr
                      key={p._id}
                      onClick={() => openPayout(p._id)}
                      className="cursor-pointer hover:bg-surface-container-low/30 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-label-md font-bold">
                        {p.payoutNo}
                        {p.totals.overriddenLines > 0 && (
                          <span
                            className="ml-1.5 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-700"
                            title="Contains manually edited amounts"
                          >
                            {p.totals.overriddenLines} edited
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">{formatPeriod(p.from, p.to)}</td>
                      <td className="py-3.5 px-4">
                        <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${style.className}`}>
                          {style.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums">{p.totals.employees}</td>
                      <td className="py-3.5 px-4 text-right tabular-nums">{inr(p.totals.gross)}</td>
                      <td className="py-3.5 px-4 text-right tabular-nums">{inr(p.totals.deductions)}</td>
                      <td className="py-3.5 px-4 text-right font-extrabold tabular-nums">{inr(p.totals.net)}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-on-surface-variant">
                        {formatDateTime(p.generatedAt)}
                        {p.generatedBy && <p className="text-[11px]">by {p.generatedBy.name}</p>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pager pagination={data?.pagination} noun="payouts" onPageChange={setPage} />
      </div>
    </div>
  );
};

export default PayoutList;
