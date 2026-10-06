import React, { useState, useEffect, useMemo } from "react";
import type { StringeeNumber } from "@/types/stringeeNumber";
import { useBranchesQuery } from "@/features/branches";

interface EditNumberModalProps {
  editingNumber: StringeeNumber | null;
  onClose: () => void;
  onUpdate: (payload: {
    numberId: string;
    phoneNumber: string;
    label?: string;
    branchId?: string | null;
  }) => void;
  isPending?: boolean;
}

export const EditNumberModal: React.FC<EditNumberModalProps> = ({
  editingNumber,
  onClose,
  onUpdate,
  isPending = false,
}) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [label, setLabel] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");

  const { data: branches = [], isLoading: isLoadingBranches } = useBranchesQuery();

  const activeBranches = useMemo(() => {
    return branches.filter((b: any) => b.isActive);
  }, [branches]);

  useEffect(() => {
    if (editingNumber) {
      setPhoneNumber(editingNumber.phoneNumber || "");
      setLabel(editingNumber.label || "");
      
      const currentBranchId =
        typeof editingNumber.branch === "object" && editingNumber.branch !== null
          ? editingNumber.branch._id
          : (editingNumber.branch) || "";
      
      setSelectedBranchId(currentBranchId);
    }
  }, [editingNumber]);

  if (!editingNumber) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    onUpdate({
      numberId: editingNumber._id,
      phoneNumber: phoneNumber.trim(),
      label: label.trim() || undefined,
      branchId: selectedBranchId || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-xl space-y-4">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <h3 className="font-headline-sm text-base font-bold text-on-surface">
            Edit Stringee Number Details
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant">Phone Number *</label>
            <input
              type="text"
              required
              placeholder="e.g. 917971730788"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-xs font-mono focus:border-primary focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant">Label (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Delhi Desk 1"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-xs focus:border-primary focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant">Assign to Branch (Optional)</label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              disabled={isLoadingBranches}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-xs focus:border-primary focus:outline-none text-on-surface disabled:opacity-50"
            >
              <option value="">Global / Unassigned Branch</option>
              {activeBranches.map((branch: any) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name} ({branch.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-outline-variant/50 px-4 py-2 text-xs font-bold text-on-surface hover:bg-surface-container-low transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !phoneNumber.trim()}
              className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary hover:opacity-95 transition-all disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditNumberModal;