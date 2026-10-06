import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useBranchesQuery } from "@/features/branches";
import { useUpdateEmployeeBranches } from "../hooks/useEmployees";
import type { Employee } from "@/types/employee";

interface AssignBranchesModalProps {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
}

const AssignBranchesModal = ({
  open,
  onClose,
  employee,
}: AssignBranchesModalProps) => {
  const { data: branches, isLoading } = useBranchesQuery();
  const updateBranches = useUpdateEmployeeBranches();

  // Lazy-initialized from props — the parent remounts this component (via a
  // `key` tied to the target employee) whenever a different row is edited.
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(employee?.branches.map((b) => b._id) ?? [])
  );

  const toggle = (branchId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(branchId)) next.delete(branchId);
      else next.add(branchId);
      return next;
    });
  };

  const handleSave = async () => {
    if (!employee) return;
    await updateBranches.mutateAsync({
      id: employee._id,
      branches: Array.from(selected),
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign Branches"
      description={
        employee ? `Choose which branches ${employee.name} can operate in.` : undefined
      }
    >
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-11 rounded-xl bg-surface-container-high animate-pulse" />
          ))}
        </div>
      ) : !branches || branches.length === 0 ? (
        <p className="font-body-md text-sm text-on-surface-variant text-center py-6">
          No active branches available. Create one first.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
          {branches.map((branch) => {
            const isChecked = selected.has(branch._id);
            return (
              <label
                key={branch._id}
                className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 transition-all cursor-pointer ${
                  isChecked
                    ? "border-primary bg-primary/5 text-primary font-medium"
                    : "border-outline-variant/40 bg-surface-container-low text-on-surface hover:bg-surface-container"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(branch._id)}
                  className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                />
                <span className="font-body-sm text-xs truncate">
                  {branch.name}{" "}
                  <span className="text-on-surface-variant/60">({branch.code})</span>
                </span>
              </label>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-outline-variant/20">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl px-4 py-2.5 font-label-md text-xs font-bold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={updateBranches.isPending || isLoading}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-label-md text-xs font-bold text-on-primary shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
        >
          <span className="material-symbols-outlined text-base">
            {updateBranches.isPending ? "sync" : "save"}
          </span>
          <span>{updateBranches.isPending ? "Saving…" : "Save Assignment"}</span>
        </button>
      </div>
    </Modal>
  );
};

export default AssignBranchesModal;
