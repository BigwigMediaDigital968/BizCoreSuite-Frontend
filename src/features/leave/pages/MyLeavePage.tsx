import { useState } from "react";
import { Navigate } from "react-router";

import RefreshButton from "@/components/ui/RefreshButton";
import { Can } from "@/components/Auth/Can";
import { PERMISSIONS, ROLES } from "@/types/auth";
import { useAuthStore } from "@/store/auth.store";
import { formatDate } from "@/utils/Date";
import {
  LEAVE_DURATION_TYPE_LABELS,
  LEAVE_REQUEST_STATUS,
  type LeaveRequestStatus,
} from "@/types/leave";
import ApplyLeaveModal from "../components/ApplyLeaveModal";
import LeaveStatusBadge from "../components/LeaveStatusBadge";
import {
  leaveKeys,
  useCancelLeaveRequest,
  useLeaveRequests,
  useMyLeaveBalances,
} from "../hooks/useLeave";

const PAGE_SIZE = 15;

const STATUS_FILTERS: { label: string; value: LeaveRequestStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Pending", value: LEAVE_REQUEST_STATUS.PENDING },
  { label: "Approved", value: LEAVE_REQUEST_STATUS.APPROVED },
  { label: "Rejected", value: LEAVE_REQUEST_STATUS.REJECTED },
  { label: "Cancelled", value: LEAVE_REQUEST_STATUS.CANCELLED },
];

const MyLeavePage = () => {
  const user = useAuthStore((s) => s.user);
  const isExecutive = user?.role === ROLES.HEAD || user?.role === ROLES.ADMIN;

  const [status, setStatus] = useState<LeaveRequestStatus | "">("");
  const [page, setPage] = useState(1);
  const [isApplyOpen, setIsApplyOpen] = useState(false);

  const { data: balances, isLoading: balancesLoading } = useMyLeaveBalances();

  const { data, isLoading, isError } = useLeaveRequests({
    employeeId: user?._id,
    status: status || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const cancelLeave = useCancelLeaveRequest();

  const requests = data?.requests ?? [];
  const pagination = data?.pagination;

  // Declared after the hooks above so their call order stays unconditional.
  if (isExecutive) {
    return <Navigate to="/leave/approvals" replace />;
  }

  return (
    <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-outline-variant/30 pb-5">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs tracking-wider uppercase mb-1">
            <span className="h-0.5 w-4 bg-primary rounded-full" />
            <span>Time Off</span>
          </div>
          <h1 className="font-headline-md text-2xl sm:text-3xl font-extrabold text-on-surface">
            My Leave
          </h1>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1 max-w-2xl">
            Track your leave balance, apply for time off, and follow the status
            of your requests.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <RefreshButton queryKey={leaveKeys.all} />

          <Can permission={PERMISSIONS.LEAVE_CREATE}>
            <button
              type="button"
              onClick={() => setIsApplyOpen(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-label-md text-xs font-bold text-on-primary shadow-sm hover:bg-primary/90 transition-all"
            >
              <span className="material-symbols-outlined text-lg">
                event_available
              </span>
              <span>Apply for Leave</span>
            </button>
          </Can>
        </div>
      </div>

      {/* Balance cards */}
      <div>
        <h2 className="font-label-md text-xs font-bold uppercase tracking-wider text-on-surface-variant/70 mb-3">
          Balance ({new Date().getFullYear()})
        </h2>

        {balancesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-surface-container-high animate-pulse"
              />
            ))}
          </div>
        ) : (balances ?? []).length === 0 ? (
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 text-center">
            <p className="font-body-sm text-xs text-on-surface-variant">
              No leave balance has been allocated to you yet. Contact your
              administrator.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(balances ?? []).map((balance) => (
              <div
                key={balance._id}
                className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm space-y-2"
              >
                <p className="font-label-sm text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/70">
                  {balance.leaveType}
                </p>
                <p className="font-headline-md text-3xl font-extrabold text-on-surface">
                  {balance.available}
                  <span className="font-body-sm text-xs font-normal text-on-surface-variant">
                    {" "}
                    / {balance.allocated + balance.carriedForward} days
                  </span>
                </p>
                <p className="font-body-sm text-[11px] text-on-surface-variant">
                  {balance.used} used · {balance.pending} pending
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value || "all"}
            type="button"
            onClick={() => {
              setStatus(filter.value);
              setPage(1);
            }}
            className={`rounded-xl px-3.5 py-2 font-label-sm text-xs font-bold transition-all ${
              status === filter.value
                ? "bg-primary text-on-primary shadow-sm"
                : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Requests table */}
      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-low/50 font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant/70">
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Days</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Applied</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 font-body-sm text-xs text-on-surface">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="py-3.5 px-4">
                      <div className="h-6 rounded-lg bg-surface-container-high animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 px-4 text-center text-on-surface-variant"
                  >
                    Failed to load your leave requests.
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 px-4 text-center text-on-surface-variant"
                  >
                    No leave requests found.
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr
                    key={request._id}
                    className="hover:bg-surface-container-low/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-label-md font-bold">
                      {request.leaveType}
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant">
                      {formatDate(request.startDate)} —{" "}
                      {formatDate(request.endDate)}
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant">
                      {LEAVE_DURATION_TYPE_LABELS[request.durationType]}
                    </td>
                    <td className="py-3.5 px-4">{request.totalDays}</td>
                    <td className="py-3.5 px-4">
                      <LeaveStatusBadge status={request.status} />
                      {request.status === LEAVE_REQUEST_STATUS.REJECTED &&
                        request.rejectionReason && (
                          <p className="mt-1 text-[10px] text-on-surface-variant/70 max-w-[220px]">
                            {request.rejectionReason}
                          </p>
                        )}
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant">
                      {formatDate(request.appliedAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {request.status === LEAVE_REQUEST_STATUS.PENDING && (
                        <Can permission={PERMISSIONS.LEAVE_CANCEL}>
                          <button
                            type="button"
                            disabled={cancelLeave.isPending}
                            onClick={() => cancelLeave.mutate(request._id)}
                            className="rounded-lg border border-outline-variant/40 px-3 py-1.5 font-label-sm text-[11px] font-bold text-on-surface-variant hover:bg-surface-container hover:text-on-surface disabled:opacity-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </Can>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-outline-variant/20 px-4 py-3">
            <p className="font-body-sm text-[11px] text-on-surface-variant">
              Page {pagination.page} of {pagination.totalPages} ·{" "}
              {pagination.total} requests
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={pagination.page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-lg">
                  chevron_left
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-lg">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      <ApplyLeaveModal
        open={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
      />
    </div>
  );
};

export default MyLeavePage;
