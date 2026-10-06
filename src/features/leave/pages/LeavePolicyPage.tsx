import { useState } from "react";

import RefreshButton from "@/components/ui/RefreshButton";
import { Can } from "@/components/Auth/Can";
import { PERMISSIONS } from "@/types/auth";
import { formatDate } from "@/utils/Date";
import { LEAVE_TYPE_LABELS, type LeavePolicy } from "@/types/leave";
import LeavePolicyFormModal from "../components/LeavePolicyFormModal";
import {
  leavePolicyKeys,
  useDeactivateLeavePolicy,
  useLeavePolicies,
} from "../hooks/useLeave";

const PAGE_SIZE = 20;

const branchLabel = (policy: LeavePolicy) => {
  if (!policy.branch) return "All branches";
  return typeof policy.branch === "object" ? policy.branch.name : "Branch";
};

const LeavePolicyPage = () => {
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<LeavePolicy | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data, isLoading, isError } = useLeavePolicies({
    page,
    limit: PAGE_SIZE,
  });

  const deactivatePolicy = useDeactivateLeavePolicy();

  const policies = data?.policies ?? [];
  const pagination = data?.pagination;

  const openCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };

  const openEdit = (policy: LeavePolicy) => {
    setEditing(policy);
    setIsFormOpen(true);
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
            Leave Policies
          </h1>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1 max-w-2xl">
            Define leave types, annual allocation, and the rules that govern how
            employees can request time off.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <RefreshButton queryKey={leavePolicyKeys.all} />

          <Can permission={PERMISSIONS.LEAVE_POLICY_CREATE}>
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-label-md text-xs font-bold text-on-primary shadow-sm hover:bg-primary/90 transition-all"
            >
              <span className="material-symbols-outlined text-lg">
                add_circle
              </span>
              <span>Create Policy</span>
            </button>
          </Can>
        </div>
      </div>

      {/* Policies table */}
      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-low/50 font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant/70">
                <th className="py-3 px-4">Policy</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Branch</th>
                <th className="py-3 px-4">Allocation</th>
                <th className="py-3 px-4">Rules</th>
                <th className="py-3 px-4">Effective</th>
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
                    Failed to load leave policies.
                  </td>
                </tr>
              ) : policies.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-10 px-4 text-center text-on-surface-variant"
                  >
                    No leave policies yet. Create one so employees can request
                    leave.
                  </td>
                </tr>
              ) : (
                policies.map((policy) => (
                  <tr
                    key={policy._id}
                    className="hover:bg-surface-container-low/30 transition-colors align-top"
                  >
                    <td className="py-3.5 px-4">
                      <p className="font-label-md font-bold">{policy.name}</p>
                      <p className="text-[11px] font-mono text-on-surface-variant/70">
                        {policy.code}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant">
                      {LEAVE_TYPE_LABELS[policy.leaveType]}
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant">
                      {branchLabel(policy)}
                    </td>
                    <td className="py-3.5 px-4">
                      {policy.annualAllocation} days
                      <p className="text-[10px] text-on-surface-variant/70">
                        {policy.isPaid ? "Paid" : "Unpaid"}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-on-surface-variant space-y-0.5">
                      <p>
                        {policy.allowHalfDay
                          ? "Half-day allowed"
                          : "Full days only"}
                      </p>
                      {policy.minimumNoticeDays > 0 && (
                        <p>{policy.minimumNoticeDays}d notice</p>
                      )}
                      {policy.maximumConsecutiveDays && (
                        <p>Max {policy.maximumConsecutiveDays} consecutive</p>
                      )}
                      {policy.allowCarryForward && (
                        <p>
                          Carry forward
                          {policy.maximumCarryForward
                            ? ` up to ${policy.maximumCarryForward}`
                            : ""}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant">
                      {formatDate(policy.applicableFrom)}
                      {policy.applicableTo
                        ? ` — ${formatDate(policy.applicableTo)}`
                        : " — ongoing"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          policy.isActive
                            ? "bg-emerald-500/10 text-emerald-700"
                            : "bg-error/10 text-error"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            policy.isActive ? "bg-emerald-500" : "bg-error"
                          }`}
                        />
                        {policy.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Can permission={PERMISSIONS.LEAVE_POLICY_UPDATE}>
                          <button
                            type="button"
                            onClick={() => openEdit(policy)}
                            aria-label="Edit policy"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                          >
                            <span className="material-symbols-outlined text-base">
                              edit
                            </span>
                          </button>

                          {policy.isActive && (
                            <button
                              type="button"
                              disabled={deactivatePolicy.isPending}
                              onClick={() =>
                                deactivatePolicy.mutate(policy._id)
                              }
                              className="rounded-lg border border-outline-variant/40 px-3 py-1.5 font-label-sm text-[11px] font-bold text-on-surface-variant hover:bg-surface-container hover:text-on-surface disabled:opacity-50 transition-colors"
                            >
                              Deactivate
                            </button>
                          )}
                        </Can>
                      </div>
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
              {pagination.total} policies
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

      <LeavePolicyFormModal
        open={isFormOpen}
        policy={editing}
        onClose={() => setIsFormOpen(false)}
      />
    </div>
  );
};

export default LeavePolicyPage;
