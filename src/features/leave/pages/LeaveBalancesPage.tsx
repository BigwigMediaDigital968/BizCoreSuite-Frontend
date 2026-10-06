import { useEffect, useState } from "react";

import Modal from "@/components/ui/Modal";
import RefreshButton from "@/components/ui/RefreshButton";
import { Can } from "@/components/Auth/Can";
import { PERMISSIONS, ROLES } from "@/types/auth";
import { useEmployeesQuery } from "@/features/employees";
import { formatDate } from "@/utils/Date";
import type { LeaveBalance } from "@/types/leave";
import {
  leaveBalanceKeys,
  useAdjustLeaveBalance,
  useAllocateLeaveBalance,
  useEmployeeLeaveBalances,
  useLeaveBalanceTransactions,
  useLeavePolicies,
} from "../hooks/useLeave";
import { useAuth } from "@/hooks/useAuth";

const CURRENT_YEAR = new Date().getFullYear();

const LeaveBalancesPage = () => {
  const { user } = useAuth();

  const [employeeId, setEmployeeId] = useState("");
  const [year, setYear] = useState(CURRENT_YEAR);

  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [allocatePolicyId, setAllocatePolicyId] = useState("");

  const [adjustTarget, setAdjustTarget] = useState<LeaveBalance | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustRemarks, setAdjustRemarks] = useState("");
  const [adjustError, setAdjustError] = useState("");

  const isManager = user?.role === ROLES.MANAGER;

  const { data: employeeData, isLoading: employeesLoading } = useEmployeesQuery(
    {
      role: ROLES.EMPLOYEE,
      limit: 100,
      // Pass reportingManager matching the backend schema
      ...(isManager && user?._id ? { reportingManager: user._id } : {}),
    },
  );

  const { data: policyData } = useLeavePolicies({
    isActive: "true",
    limit: 100,
  });

  const employees = employeeData?.employees ?? [];
  const policies = policyData?.policies ?? [];

  // 2. Single unified effect to handle default selection and list changes
  useEffect(() => {
    if (employeesLoading) return;

    // For non-managers (Employees), default to their own user/profile ID
    if (!isManager && user?._id) {
      // Check if employee has a profile record returned in employees query
      const selfProfile = employees.find(
        (emp) => emp.user?._id === user._id || emp._id === user._id,
      );
      setEmployeeId(selfProfile?._id || user._id);
      return;
    }

    // For Managers/Admins: Validate or select first available option
    const isValidSelection = employees.some((emp) => emp._id === employeeId);

    if ((!employeeId || !isValidSelection) && employees.length > 0) {
      setEmployeeId(employees[0]._id);
    } else if (employees.length === 0) {
      setEmployeeId("");
    }
  }, [employees, employeeId, employeesLoading, isManager, user?._id]);

  const { data: balances, isLoading: balancesLoading } =
    useEmployeeLeaveBalances(employeeId || undefined, year);

  const { data: transactions, isLoading: transactionsLoading } =
    useLeaveBalanceTransactions(employeeId || undefined);

  const allocateBalance = useAllocateLeaveBalance();
  const adjustBalance = useAdjustLeaveBalance();

  const handleAllocate = async () => {
    if (!employeeId || !allocatePolicyId) return;

    try {
      await allocateBalance.mutateAsync({
        employeeId,
        leavePolicyId: allocatePolicyId,
        year,
      });
      setIsAllocateOpen(false);
      setAllocatePolicyId("");
    } catch {
      // Surfaced by the mutation's error toast.
    }
  };

  const closeAdjust = () => {
    setAdjustTarget(null);
    setAdjustAmount("");
    setAdjustRemarks("");
    setAdjustError("");
  };

  const handleAdjust = async () => {
    if (!adjustTarget) return;

    const amount = Number(adjustAmount);

    // Backend rejects zero and requires 3+ characters of justification.
    if (!adjustAmount.trim() || Number.isNaN(amount) || amount === 0) {
      setAdjustError("Enter a non-zero amount (negative to deduct)");
      return;
    }
    if (adjustRemarks.trim().length < 3) {
      setAdjustError("Remarks must be at least 3 characters");
      return;
    }

    try {
      await adjustBalance.mutateAsync({
        leaveBalanceId: adjustTarget._id,
        payload: { employeeId, amount, remarks: adjustRemarks.trim() },
      });
      closeAdjust();
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
            Leave Balances
          </h1>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1 max-w-2xl">
            Allocate annual entitlements, make manual adjustments, and audit the
            full transaction history per employee.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <RefreshButton queryKey={leaveBalanceKeys.all} />

          <Can permission={PERMISSIONS.LEAVE_BALANCE_MANAGE}>
            <button
              type="button"
              disabled={!employeeId}
              onClick={() => setIsAllocateOpen(true)}
              title={!employeeId ? "Select an employee first" : undefined}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-label-md text-xs font-bold text-on-primary shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              <span className="material-symbols-outlined text-lg">
                add_circle
              </span>
              <span>Allocate</span>
            </button>
          </Can>
        </div>
      </div>

      {/* Employee + year picker */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Render employee selector ONLY for admins/managers with balance management permissions */}
        <Can permission={PERMISSIONS.LEAVE_BALANCE_MANAGE}>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            disabled={employeesLoading}
            className="rounded-xl border border-outline-variant/30 bg-surface-container-low px-3.5 py-2.5 text-xs font-semibold text-on-surface outline-none focus:border-primary disabled:opacity-50"
          >
            <option value="">
              {employeesLoading
                ? "Loading employees…"
                : isManager
                  ? "Select assigned employee"
                  : "Select an employee"}
            </option>
            {employees.map((employee) => (
              <option key={employee._id} value={employee._id}>
                {employee.name}
              </option>
            ))}
          </select>
        </Can>

        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="rounded-xl border border-outline-variant/30 bg-surface-container-low px-3.5 py-2.5 text-xs font-semibold text-on-surface outline-none focus:border-primary"
        >
          {[CURRENT_YEAR + 1, CURRENT_YEAR, CURRENT_YEAR - 1].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      {!employeeId ? (
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-10 text-center">
          <span className="material-symbols-outlined text-3xl text-on-surface-variant/50">
            person_search
          </span>
          <p className="mt-2 font-body-sm text-xs text-on-surface-variant">
            Select an employee to view and manage their leave balances.
          </p>
        </div>
      ) : (
        <>
          {/* Balances */}
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/20 bg-surface-container-low/50 font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant/70">
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Allocated</th>
                    <th className="py-3 px-4">Carried</th>
                    <th className="py-3 px-4">Used</th>
                    <th className="py-3 px-4">Pending</th>
                    <th className="py-3 px-4">Adjusted</th>
                    <th className="py-3 px-4">Available</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 font-body-sm text-xs text-on-surface">
                  {balancesLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={8} className="py-3.5 px-4">
                          <div className="h-6 rounded-lg bg-surface-container-high animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : (balances ?? []).length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-10 px-4 text-center text-on-surface-variant"
                      >
                        No balances allocated for {year}.
                      </td>
                    </tr>
                  ) : (
                    (balances ?? []).map((balance) => (
                      <tr
                        key={balance._id}
                        className="hover:bg-surface-container-low/30 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-label-md font-bold">
                          {balance.leaveType}
                        </td>
                        <td className="py-3.5 px-4">{balance.allocated}</td>
                        <td className="py-3.5 px-4">
                          {balance.carriedForward}
                        </td>
                        <td className="py-3.5 px-4">{balance.used}</td>
                        <td className="py-3.5 px-4">{balance.pending}</td>
                        <td className="py-3.5 px-4">{balance.adjusted}</td>
                        <td className="py-3.5 px-4 font-label-md font-bold text-primary">
                          {balance.available}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Can permission={PERMISSIONS.LEAVE_BALANCE_MANAGE}>
                            <button
                              type="button"
                              onClick={() => setAdjustTarget(balance)}
                              className="rounded-lg border border-outline-variant/40 px-3 py-1.5 font-label-sm text-[11px] font-bold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                            >
                              Adjust
                            </button>
                          </Can>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transaction history */}
          <Can permission={PERMISSIONS.LEAVE_BALANCE_TRANSACTION_VIEW}>
            <div>
              <h2 className="font-label-md text-xs font-bold uppercase tracking-wider text-on-surface-variant/70 mb-3">
                Transaction History
              </h2>

              <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant/20 bg-surface-container-low/50 font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant/70">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Source</th>
                        <th className="py-3 px-4">Leave</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Before → After</th>
                        <th className="py-3 px-4">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20 font-body-sm text-xs text-on-surface">
                      {transactionsLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <tr key={i}>
                            <td colSpan={7} className="py-3.5 px-4">
                              <div className="h-6 rounded-lg bg-surface-container-high animate-pulse" />
                            </td>
                          </tr>
                        ))
                      ) : (transactions ?? []).length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-10 px-4 text-center text-on-surface-variant"
                          >
                            No balance transactions recorded.
                          </td>
                        </tr>
                      ) : (
                        (transactions ?? []).map((transaction) => (
                          <tr
                            key={transaction._id}
                            className="hover:bg-surface-container-low/30 transition-colors"
                          >
                            <td className="py-3.5 px-4 text-on-surface-variant">
                              {formatDate(transaction.createdAt)}
                            </td>
                            <td className="py-3.5 px-4 capitalize font-label-md font-bold">
                              {transaction.transactionType}
                            </td>
                            <td className="py-3.5 px-4 text-on-surface-variant">
                              {transaction.source.replace(/_/g, " ")}
                            </td>
                            <td className="py-3.5 px-4">
                              {transaction.leaveType}
                            </td>
                            <td
                              className={`py-3.5 px-4 font-bold ${
                                transaction.amount < 0
                                  ? "text-error"
                                  : "text-emerald-600"
                              }`}
                            >
                              {transaction.amount > 0 ? "+" : ""}
                              {transaction.amount}
                            </td>
                            <td className="py-3.5 px-4 text-on-surface-variant">
                              {transaction.balanceBefore} →{" "}
                              {transaction.balanceAfter}
                            </td>
                            <td className="py-3.5 px-4 text-on-surface-variant max-w-[220px]">
                              {transaction.remarks || "—"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Can>
        </>
      )}

      {/* Allocate */}
      <Modal
        title="Allocate Leave Balance"
        open={isAllocateOpen}
        onClose={() => setIsAllocateOpen(false)}
        size="sm"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block font-label-md text-xs font-medium text-on-surface-variant">
              Policy <span className="text-error">*</span>
            </label>
            <select
              value={allocatePolicyId}
              onChange={(e) => setAllocatePolicyId(e.target.value)}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
            >
              <option value="">Select a policy</option>
              {policies.map((policy) => (
                <option key={policy._id} value={policy._id}>
                  {policy.name} ({policy.annualAllocation} days)
                </option>
              ))}
            </select>
          </div>

          <p className="font-body-sm text-[11px] text-on-surface-variant">
            Allocating for <span className="font-bold">{year}</span>. The
            allocation amount comes from the policy.
          </p>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAllocateOpen(false)}
              className="rounded-xl border border-outline-variant/40 px-4 py-2 font-label-md text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAllocate}
              disabled={allocateBalance.isPending || !allocatePolicyId}
              className="rounded-xl bg-primary px-5 py-2 font-label-md text-xs font-bold text-on-primary hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {allocateBalance.isPending ? "Allocating…" : "Allocate"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Adjust */}
      <Modal
        title="Adjust Leave Balance"
        open={Boolean(adjustTarget)}
        onClose={closeAdjust}
        size="sm"
      >
        <div className="space-y-4">
          <p className="font-body-sm text-xs text-on-surface-variant">
            Adjusting{" "}
            <span className="font-bold text-on-surface">
              {adjustTarget?.leaveType}
            </span>{" "}
            — currently{" "}
            <span className="font-bold text-on-surface">
              {adjustTarget?.available}
            </span>{" "}
            days available.
          </p>

          <div className="space-y-1.5">
            <label className="block font-label-md text-xs font-medium text-on-surface-variant">
              Amount <span className="text-error">*</span>
            </label>
            <input
              type="number"
              step="0.5"
              value={adjustAmount}
              placeholder="e.g. 2 to credit, -1 to deduct"
              onChange={(e) => setAdjustAmount(e.target.value)}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-label-md text-xs font-medium text-on-surface-variant">
              Remarks <span className="text-error">*</span>
            </label>
            <textarea
              rows={3}
              value={adjustRemarks}
              maxLength={500}
              placeholder="Why is this adjustment being made?"
              onChange={(e) => setAdjustRemarks(e.target.value)}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary resize-none"
            />
          </div>

          {adjustError && (
            <p className="font-body-sm text-[11px] text-error">{adjustError}</p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeAdjust}
              className="rounded-xl border border-outline-variant/40 px-4 py-2 font-label-md text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdjust}
              disabled={adjustBalance.isPending}
              className="rounded-xl bg-primary px-5 py-2 font-label-md text-xs font-bold text-on-primary hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {adjustBalance.isPending ? "Saving…" : "Apply Adjustment"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LeaveBalancesPage;
