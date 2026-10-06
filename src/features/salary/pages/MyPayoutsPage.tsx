import { useState } from "react";
import { Link } from "react-router";

import Pager from "@/features/dailyReports/components/Pager";
import { ROUTES } from "@/config/routes";
import { useMyPayouts } from "../hooks/useSalary";
import { formatDateTime, formatPeriod, inr, MY_STATUS } from "../utils";

const MyPayoutsPage = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useMyPayouts(page);
  const payouts = data?.payouts ?? [];

  return (
    <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="border-b border-outline-variant/30 pb-5">
        <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
          <span className="h-0.5 w-4 rounded-full bg-primary" />
          <span>Salary</span>
        </div>
        <h1 className="font-headline-md text-2xl font-extrabold text-on-surface sm:text-3xl">My Payouts</h1>
        <p className="mt-1 max-w-2xl text-xs text-on-surface-variant sm:text-sm">
          Your salary for each pay period, with the days, earnings and deductions behind it.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-surface-container-high animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <p className="py-10 text-center text-xs text-on-surface-variant">Failed to load your payouts.</p>
      ) : payouts.length === 0 ? (
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-10 text-center shadow-sm">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/50">payments</span>
          <p className="mt-2 text-sm font-bold text-on-surface">No payouts yet</p>
          <p className="mt-1 text-xs text-on-surface-variant">
            Your payslips will appear here once a payout that includes you is generated.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {payouts.map((p) => {
              const status = MY_STATUS[p.status];
              return (
                <Link
                  key={p._id}
                  to={ROUTES.myPayslip.replace(":id", p._id)}
                  className="group rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-on-surface">{formatPeriod(p.from, p.to)}</p>
                      <p className="text-[11px] text-on-surface-variant">{p.payoutNo}</p>
                    </div>
                    <span className={`flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${status.className}`}>
                      <span className="material-symbols-outlined text-sm">{status.icon}</span>
                      {status.label}
                    </span>
                  </div>

                  <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/80">Net pay</p>
                  <p className="text-2xl font-extrabold tabular-nums text-on-surface">{inr(p.net)}</p>

                  <div className="mt-3 flex items-center justify-between border-t border-outline-variant/20 pt-3 text-[11px] text-on-surface-variant">
                    <span>
                      Gross {inr(p.gross)} · Deductions {inr(p.deductions)}
                    </span>
                    <span className="material-symbols-outlined text-base text-on-surface-variant transition-transform group-hover:translate-x-0.5">
                      chevron_right
                    </span>
                  </div>
                  {p.status === "paid" && p.paidAt && (
                    <p className="mt-1 text-[11px] text-emerald-700">Paid {formatDateTime(p.paidAt)}</p>
                  )}
                </Link>
              );
            })}
          </div>
          <div className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest empty:hidden">
            <Pager pagination={data?.pagination} noun="payouts" onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
};

export default MyPayoutsPage;
