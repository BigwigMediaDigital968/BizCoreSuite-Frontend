import { useEffect, useMemo, useRef, useState } from "react";
import Modal from "@/components/ui/Modal";
import { useBranchesQuery } from "@/features/branches";
import { useEmployeeProfilesQuery } from "@/features/employees";
import { useAuthStore } from "@/store/auth.store";
import { ROLES } from "@/types/auth";
import { useAssignLead, useBulkAssignLeads } from "../hooks/useLeads";

interface AssignLeadModalProps {
  open: boolean;
  leadId?: string;
  leadIds?: string[];
  leadName: string;
  currentBranchId?: string;
  currentEmployeeId?: string;
  onClose: () => void;
}

const AssignLeadModal = ({
  open,
  leadId,
  leadIds,
  leadName,
  currentBranchId,
  currentEmployeeId,
  onClose,
}: AssignLeadModalProps) => {
  const [branchId, setBranchId] = useState(currentBranchId ?? "");
  const [branchSearch, setBranchSearch] = useState("");
  const [isBranchListOpen, setIsBranchListOpen] = useState(false);
  const branchFieldRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [employeeId, setEmployeeId] = useState(currentEmployeeId ?? "");

  const assignLead = useAssignLead();
  const bulkAssign = useBulkAssignLeads();
  const isBulk = Boolean(leadIds?.length);

  const currentUser = useAuthStore((s) => s.user);
  const isHead = currentUser?.role === ROLES.HEAD;

  const { data: branches, isLoading: branchesLoading } = useBranchesQuery();

  // Manager/Employee are hard-restricted to exactly one branch
  // (user.service.ts singleBranchRoles) — narrowing "which branch" is
  // meaningless when there's only one possible answer, and the employee
  // list below is already scoped server-side to the caller's own
  // branch(es) regardless of this dropdown's value. Driven by actual
  // accessible-branch count rather than hardcoded per role.
  const assignableBranches = useMemo(() => {
    if (!branches) return [];
    if (isHead) return branches;
    const own = new Set(currentUser?.branches ?? []);
    return branches.filter((b) => own.has(b._id));
  }, [branches, isHead, currentUser?.branches]);

  const showBranchFilter = assignableBranches.length > 1;

  const filteredBranches = useMemo(() => {
    if (!branchSearch.trim()) return assignableBranches;
    const q = branchSearch.trim().toLowerCase();
    return assignableBranches.filter((branch) =>
      branch.name.toLowerCase().includes(q),
    );
  }, [assignableBranches, branchSearch]);

  const { data: employeeData, isLoading: employeesLoading } =
    useEmployeeProfilesQuery({
      branchId,
      limit: 100,
    });

  useEffect(() => {
    if (!open) return;
    setBranchId(
      currentBranchId ??
        (assignableBranches.length === 1 ? assignableBranches[0]._id : ""),
    );
    setBranchSearch("");
    setIsBranchListOpen(false);
    setEmployeeId("");
    setSearch("");
  }, [open, currentBranchId, leadId, assignableBranches]);

  useEffect(() => {
    if (!isBranchListOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        branchFieldRef.current &&
        !branchFieldRef.current.contains(e.target as Node)
      ) {
        setIsBranchListOpen(false);
        setBranchSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isBranchListOpen]);

  useEffect(() => {
    if (!currentEmployeeId || employeeId || !employeeData) return;
    const currentProfile = employeeData.profiles.find(
      (profile) =>
        (typeof profile.user === "string" ? profile.user : profile.user._id) ===
        currentEmployeeId,
    );
    if (currentProfile) setEmployeeId(currentProfile._id);
  }, [currentEmployeeId, employeeData, employeeId]);

  const filteredEmployees = useMemo(() => {
    const list = employeeData?.profiles.filter((e)=>e.user.role === "employee") ?? [];

    if (!search.trim()) return list;

    const q = search.trim().toLowerCase();

    return list.filter((employee) => {
      // if (typeof employee.user === "string") {
      //     return employee.user.toLowerCase().includes(q);
      // }

      return employee.user.name.toLowerCase().includes(q);
    });
  }, [employeeData, search]);

  const handleBranchChange = (id: string) => {
    setBranchId(id);
    setBranchSearch("");
    setEmployeeId("");
    setIsBranchListOpen(false);
  };

  const selectedBranchLabel = branchId
    ? assignableBranches.find((b) => b._id === branchId)?.name ?? "All branches"
    : "All branches";

  const handleConfirm = async () => {
    if (!employeeId && !branchId) return;

    const payload = {
      employeeId: employeeId || undefined,
      branchId: branchId || undefined,
    };

    if (isBulk && leadIds) {
      await bulkAssign.mutateAsync({ leadIds, ...payload });
    } else if (leadId) {
      await assignLead.mutateAsync({ id: leadId, payload });
    } else {
      return;
    }

    onClose();
  };

  const handleClose = () => {
    setSearch("");
    onClose();
  };

  return (
    <Modal title="Assign Lead" open={open} onClose={handleClose} size="sm">
      <div className="space-y-4">
        <p className="font-body-sm text-xs text-on-surface-variant">
          Assigning{" "}
          <span className="font-semibold text-on-surface">
            {isBulk ? `${leadIds?.length ?? 0} selected leads` : leadName}
          </span>{" "}
          to a branch representative, or to a branch only.
        </p>

        {/* Branch filter — hidden when the caller only has one
                    accessible branch (Manager/Employee always; Head/Admin
                    when the org only has one), since there's nothing to
                    narrow down. */}
        {showBranchFilter && (
          <div className="relative" ref={branchFieldRef}>
            <label className="font-label-sm text-[10px] uppercase font-bold text-on-surface-variant/70 block mb-1">
              Branch
            </label>

            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-base text-on-surface-variant/50">
                search
              </span>

              <input
                type="text"
                placeholder={selectedBranchLabel}
                value={branchSearch}
                onFocus={() => setIsBranchListOpen(true)}
                onChange={(e) => {
                  setBranchSearch(e.target.value);
                  setIsBranchListOpen(true);
                }}
                disabled={branchesLoading}
                className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest pl-8 pr-3 py-2 text-sm text-on-surface outline-none focus:border-primary disabled:opacity-50"
              />
            </div>

            {isBranchListOpen && (
              <div className="absolute left-0 right-0 z-30 mt-1 max-h-40 overflow-y-auto rounded-lg border border-outline-variant/30 bg-surface-container-lowest shadow-lg divide-y divide-outline-variant/20">
                <button
                  type="button"
                  onClick={() => handleBranchChange("")}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm transition-colors ${
                    branchId === ""
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-on-surface hover:bg-surface-container-low"
                  }`}
                >
                  <span>All branches</span>
                  {branchId === "" && (
                    <span className="material-symbols-outlined text-base">
                      check_circle
                    </span>
                  )}
                </button>

                {filteredBranches.length === 0 ? (
                  <p className="py-4 text-center font-body-sm text-xs text-on-surface-variant/70">
                    No branches found.
                  </p>
                ) : (
                  filteredBranches.map((branch) => {
                    const selected = branch._id === branchId;

                    return (
                      <button
                        key={branch._id}
                        type="button"
                        onClick={() => handleBranchChange(branch._id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm transition-colors ${
                          selected
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-on-surface hover:bg-surface-container-low"
                        }`}
                      >
                        <span className="truncate">{branch.name}</span>
                        {selected && (
                          <span className="material-symbols-outlined text-base">
                            check_circle
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* Employee search */}
        <div>
          <div className="flex items-baseline justify-between">
            <label className="font-label-sm text-[10px] uppercase font-bold text-on-surface-variant/70 block mb-1">
              Representative
            </label>
            <span className="font-body-sm text-[10px] text-on-surface-variant/60">
              Optional — leave unpicked to assign the branch only
            </span>
          </div>

          <div className="relative mb-2">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-base text-on-surface-variant/50">
              search
            </span>

            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest pl-8 pr-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
            />
          </div>

          <div className="max-h-56 overflow-y-auto rounded-lg border border-outline-variant/30 divide-y divide-outline-variant/20">
            {employeesLoading ? (
              <div className="flex items-center justify-center py-6">
                <span className="material-symbols-outlined animate-spin text-lg text-primary">
                  progress_activity
                </span>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <p className="py-6 text-center font-body-sm text-xs text-on-surface-variant/70">
                No representatives found.
              </p>
            ) : (
              filteredEmployees.map((employee) => {
                const selected = employee._id === employeeId;

                const employeeName =
                  typeof employee.user === "string"
                    ? employee.user
                    : employee.user.name;

                return (
                  <button
                    key={employee._id}
                    type="button"
                    onClick={() =>
                      setEmployeeId(selected ? "" : employee._id)
                    }
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm transition-colors ${
                      selected
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-on-surface hover:bg-surface-container-low"
                    }`}
                  >
                    <span className="truncate">{employeeName}</span>

                    {selected && (
                      <span className="material-symbols-outlined text-base">
                        check_circle
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-outline-variant/40 px-3.5 py-1.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={
              (!employeeId && !branchId) ||
              assignLead.isPending ||
              bulkAssign.isPending
            }
            className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-on-primary hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {assignLead.isPending || bulkAssign.isPending
              ? "Assigning..."
              : employeeId
                ? "Confirm Assignment"
                : "Assign to Branch"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AssignLeadModal;
