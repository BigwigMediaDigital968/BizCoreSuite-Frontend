import { useState } from "react";

import Modal from "@/components/ui/Modal";
import RefreshButton from "@/components/ui/RefreshButton";
import { Can } from "@/components/Auth/Can";
import { PERMISSIONS, ROLES } from "@/types/auth";
import { useAuthStore } from "@/store/auth.store";
import { useBranchesQuery } from "@/features/branches";
import { formatDate } from "@/utils/Date";
import {
  LEAVE_DURATION_TYPE_LABELS,
  LEAVE_REQUEST_STATUS,
  type LeaveRequest,
  type LeaveRequestStatus,
} from "@/types/leave";
import LeaveStatusBadge from "../components/LeaveStatusBadge";
import {
  leaveKeys,
  useApproveLeaveRequest,
  useLeaveRequests,
  useRejectLeaveRequest,
} from "../hooks/useLeave";

const PAGE_SIZE = 15;

const STATUS_FILTERS: { label: string; value: LeaveRequestStatus | "" }[] = [
  { label: "Pending", value: LEAVE_REQUEST_STATUS.PENDING },
  { label: "Approved", value: LEAVE_REQUEST_STATUS.APPROVED },
  { label: "Rejected", value: LEAVE_REQUEST_STATUS.REJECTED },
  { label: "Cancelled", value: LEAVE_REQUEST_STATUS.CANCELLED },
  { label: "All", value: "" },
];

const employeeName = (request: LeaveRequest) =>
  typeof request.employee === "object" ? request.employee.name : "—";

const employeeEmail = (request: LeaveRequest) =>
  typeof request.employee === "object" ? request.employee.email : "";

const branchName = (request: LeaveRequest) =>
  typeof request.branch === "object" ? request.branch.name : "—";

const LeaveApprovalsPage = () => {
  const currentUser = useAuthStore((s) => s.user);
  const isHead = currentUser?.role === ROLES.HEAD;

  const [status, setStatus] = useState<LeaveRequestStatus | "">(
    LEAVE_REQUEST_STATUS.PENDING
  );
  const [branchId, setBranchId] = useState("");
  const [page, setPage] = useState(1);

  const [rejectTarget, setRejectTarget] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  const { data: branches } = useBranchesQuery();

  // Head sees every branch; everyone else is already scoped server-side.
  const assignableBranches = (branches ?? []).filter((branch) =>
    isHead ? true : (currentUser?.branches ?? []).includes(branch._id)
  );
  const showBranchFilter = assignableBranches.length > 1;

  const { data, isLoading, isError } = useLeaveRequests({
    status: status || undefined,
    branchId: branchId || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const approveLeave = useApproveLeaveRequest();
  const rejectLeave = useRejectLeaveRequest();

  const requests = data?.requests ?? [];
  const pagination = data?.pagination;

  const closeReject = () => {
    setRejectTarget(null);
    setRejectionReason("");
    setRejectError("");
  };

  const handleReject = async () => {
    if (!rejectTarget) return;

    // Backend requires at least 3 characters.
    if (rejectionReason.trim().length < 3) {
      setRejectError("Please give a reason of at least 3 characters");
      return;
    }

    try {
      await rejectLeave.mutateAsync({
        id: rejectTarget._id,
        rejectionReason: rejectionReason.trim(),
      });
      closeReject();
    } catch {
      // Surfaced by the mutation's error toast.
    }
  };

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
            Leave Approvals
          </h1>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1 max-w-2xl">
            Review, approve, and reject leave requests from your team.
          </p>
        </div>

        <RefreshButton
          queryKey={leaveKeys.all}
          className="self-start md:self-auto shrink-0"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
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

        {showBranchFilter && (
          <select
            value={branchId}
            onChange={(e) => {
              setBranchId(e.target.value);
              setPage(1);
            }}
            className="ml-auto rounded-xl border border-outline-variant/30 bg-surface-container-low px-3.5 py-2 text-xs font-semibold text-on-surface outline-none focus:border-primary"
          >
            <option value="">All branches</option>
            {assignableBranches.map((branch) => (
              <option key={branch._id} value={branch._id}>
                {branch.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Requests table */}
      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-low/50 font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant/70">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Branch</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Days</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 font-body-sm text-xs text-on-surface">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="py-3.5 px-4">
                      <div className="h-6 rounded-lg bg-surface-container-high animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-10 px-4 text-center text-on-surface-variant"
                  >
                    Failed to load leave requests.
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-10 px-4 text-center text-on-surface-variant"
                  >
                    No leave requests match this filter.
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr
                    key={request._id}
                    className="hover:bg-surface-container-low/30 transition-colors align-top"
                  >
                    <td className="py-3.5 px-4">
                      <p className="font-label-md font-bold">
                        {employeeName(request)}
                      </p>
                      <p className="text-[11px] text-on-surface-variant/70">
                        {employeeEmail(request)}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant">
                      {branchName(request)}
                    </td>
                    <td className="py-3.5 px-4 font-label-md font-bold">
                      {request.leaveType}
                      <p className="font-body-sm text-[10px] font-normal text-on-surface-variant/70">
                        {LEAVE_DURATION_TYPE_LABELS[request.durationType]}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant">
                      {formatDate(request.startDate)} —{" "}
                      {formatDate(request.endDate)}
                    </td>
                    <td className="py-3.5 px-4">{request.totalDays}</td>
                    <td className="py-3.5 px-4 text-on-surface-variant max-w-[200px]">
                      {request.reason || "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      <LeaveStatusBadge status={request.status} />
                      {request.status === LEAVE_REQUEST_STATUS.REJECTED &&
                        request.rejectionReason && (
                          <p className="mt-1 text-[10px] text-on-surface-variant/70 max-w-[200px]">
                            {request.rejectionReason}
                          </p>
                        )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {request.status === LEAVE_REQUEST_STATUS.PENDING && (
                        <div className="flex items-center justify-end gap-2">
                          <Can permission={PERMISSIONS.LEAVE_APPROVE}>
                            <button
                              type="button"
                              disabled={approveLeave.isPending}
                              onClick={() => approveLeave.mutate(request._id)}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 font-label-sm text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                            >
                              Approve
                            </button>
                          </Can>

                          <Can permission={PERMISSIONS.LEAVE_REJECT}>
                            <button
                              type="button"
                              onClick={() => setRejectTarget(request)}
                              className="rounded-lg border border-error/40 px-3 py-1.5 font-label-sm text-[11px] font-bold text-error hover:bg-error/10 transition-colors"
                            >
                              Reject
                            </button>
                          </Can>
                        </div>
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

      {/* Rejection reason — required by the backend, so it gets its own step. */}
      <Modal
        title="Reject Leave Request"
        open={Boolean(rejectTarget)}
        onClose={closeReject}
        size="sm"
      >
        <div className="space-y-4">
          <p className="font-body-sm text-xs text-on-surface-variant">
            Rejecting{" "}
            <span className="font-bold text-on-surface">
              {rejectTarget ? employeeName(rejectTarget) : ""}
            </span>
            's request for{" "}
            <span className="font-bold text-on-surface">
              {rejectTarget?.totalDays} day(s)
            </span>
            .
          </p>

          <div className="space-y-1.5">
            <label className="block font-label-md text-xs font-medium text-on-surface-variant">
              Reason <span className="text-error">*</span>
            </label>
            <textarea
              rows={3}
              value={rejectionReason}
              maxLength={2000}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this request is being rejected"
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary resize-none"
            />
            {rejectError && (
              <p className="font-body-sm text-[11px] text-error">
                {rejectError}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeReject}
              className="rounded-xl border border-outline-variant/40 px-4 py-2 font-label-md text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={rejectLeave.isPending}
              className="rounded-xl bg-error px-5 py-2 font-label-md text-xs font-bold text-white hover:bg-error/90 disabled:opacity-50 transition-colors"
            >
              {rejectLeave.isPending ? "Rejecting…" : "Reject Request"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LeaveApprovalsPage;
