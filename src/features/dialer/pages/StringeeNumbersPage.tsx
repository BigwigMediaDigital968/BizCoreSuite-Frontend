import { useMemo, useState } from "react";
import {
  stringeeNumberKeys,
  useStringeeNumbersQuery,
  useCreateStringeeNumber,
  useAssignStringeeNumber,
  useUpdateStringeeNumber, // Add your update hook here
} from "@/features/dialer/hooks/useStringeeNumbers";
import { Can } from "@/components/Auth/Can";
import RefreshButton from "@/components/ui/RefreshButton";
import type { StringeeNumber } from "@/types/stringeeNumber";
import { useBranchesQuery } from "@/features/branches";
import AssignNumberModal from "../components/AssignNumberModal";
import EditNumberModal from "../components/EditNumberModal";
import { PERMISSIONS } from "@/types/auth";

export const StringeeNumbersPage = () => {
  // Data Hooks
  const { data: numbers = [], isLoading, isError } = useStringeeNumbersQuery();
  const { data: branches = [], isLoading: isLoadingBranches } =
    useBranchesQuery();

  const createMutation = useCreateStringeeNumber();
  const assignMutation = useAssignStringeeNumber();
  const updateMutation = useUpdateStringeeNumber(); // Mutation hook for updating number details

  // State for Add Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [label, setLabel] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");

  // State for Modals
  const [editingNumber, setEditingNumber] = useState<StringeeNumber | null>(
    null,
  );
  const [assigningNumber, setAssigningNumber] = useState<StringeeNumber | null>(
    null,
  );

  // Only present active branches for selection
  const activeBranches = useMemo(() => {
    return branches.filter((b) => b.isActive);
  }, [branches]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    createMutation.mutate(
      {
        phoneNumber: phoneNumber.trim(),
        label: label.trim() || undefined,
        branchId: selectedBranchId || undefined,
      },
      {
        onSuccess: () => {
          setIsAddModalOpen(false);
          setPhoneNumber("");
          setLabel("");
          setSelectedBranchId("");
        },
      },
    );
  };

  const handleUnassign = (numberId: string) => {
    assignMutation.mutate({
      numberId,
      targetUserId: null,
    });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-outline-variant/30 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Dialer Management
            </span>
          </div>
          <h1 className="font-headline-md text-2xl sm:text-3xl font-extrabold text-on-surface mt-1">
            Stringee Virtual Numbers
          </h1>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Manage virtual phone numbers, inventory, and branch/employee
            assignments.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <RefreshButton queryKey={stringeeNumberKeys.all} />

          <Can permission="stringee_number:create">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary shadow-sm hover:opacity-95 transition-all"
            >
              <span className="material-symbols-outlined text-base">
                add_call
              </span>
              <span>Add New Number</span>
            </button>
          </Can>
        </div>
      </div>

      {/* KPI Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="font-label-sm text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Total Inventory
            </span>
            <div className="text-2xl font-extrabold text-on-surface mt-1">
              {numbers.length}
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl text-sky-600 bg-sky-500/10">
            <span className="material-symbols-outlined text-xl">tag</span>
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="font-label-sm text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Assigned Numbers
            </span>
            <div className="text-2xl font-extrabold text-on-surface mt-1">
              {numbers.filter((n: any) => n.assignedTo).length}
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl text-emerald-600 bg-emerald-500/10">
            <span className="material-symbols-outlined text-xl">
              assignment_ind
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="font-label-sm text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Available / Unassigned
            </span>
            <div className="text-2xl font-extrabold text-on-surface mt-1">
              {numbers.filter((n: any) => !n.assignedTo).length}
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl text-amber-600 bg-amber-500/10">
            <span className="material-symbols-outlined text-xl">
              phonelink_ring
            </span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div>
            <h2 className="font-headline-sm text-base font-bold text-on-surface">
              Number Pool & Assignments
            </h2>
            <p className="font-body-sm text-xs text-on-surface-variant">
              Directly map Stringee virtual lines to reps or branch teams.
            </p>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant">
            call
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs font-medium text-on-surface-variant">
            Loading Stringee inventory...
          </div>
        ) : isError ? (
          <div className="py-12 text-center text-xs font-medium text-rose-600">
            Failed to load virtual numbers. Please try again.
          </div>
        ) : numbers.length === 0 ? (
          <div className="py-12 text-center text-xs font-medium text-on-surface-variant">
            No virtual numbers registered yet. Click "Add New Number" to get
            started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/20 bg-surface-container-low/50 font-label-md text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  <th className="py-2.5 px-3">Phone Number</th>
                  <th className="py-2.5 px-3">Label</th>
                  <th className="py-2.5 px-3">Branch</th>
                  <th className="py-2.5 px-3">Assigned Employee</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-xs font-body-sm">
                {numbers.map((item: any) => (
                  <tr
                    key={item._id}
                    className="hover:bg-surface-container-low/30 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-on-surface flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-primary">
                          phone
                        </span>
                        {item.phoneNumber}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-on-surface-variant">
                      {item.label || (
                        <span className="text-on-surface-variant/40">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-medium text-on-surface">
                      {item.branch?.name || (
                        <span className="text-on-surface-variant/40">
                          Global
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {item.assignedTo ? (
                        <div>
                          <div className="font-bold text-on-surface">
                            {item.assignedTo.name}
                          </div>
                          <div className="text-[11px] text-on-surface-variant/70">
                            {item.assignedTo.email}
                          </div>
                        </div>
                      ) : (
                        <span className="italic text-on-surface-variant/50">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          item.assignedTo
                            ? "bg-emerald-500/10 text-emerald-700"
                            : "bg-amber-500/10 text-amber-700"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            item.assignedTo ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                        />
                        {item.assignedTo ? "Assigned" : "Available"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit Number Details Button */}
                        <Can permission={[PERMISSIONS.STRINGEE_NUMBER_UPDATE]}>
                          <button
                            type="button"
                            onClick={() => setEditingNumber(item)}
                            className="inline-flex items-center gap-1 rounded-lg border border-outline-variant/50 bg-surface-container-low px-2 py-1 text-[11px] font-bold text-on-surface hover:bg-surface-container-high transition-all"
                            title="Edit number details"
                          >
                            <span className="material-symbols-outlined text-sm">
                              edit
                            </span>
                            Edit Details
                          </button>
                        </Can>

                        {/* Employee Assignment Button */}
                        <Can permission="stringee_number:assign">
                          {item.assignedTo ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setAssigningNumber(item)}
                                className="inline-flex items-center gap-1 rounded-lg border border-outline-variant/50 bg-surface-container-low px-2 py-1 text-[11px] font-bold text-on-surface hover:bg-primary hover:text-on-primary transition-all"
                              >
                                <span className="material-symbols-outlined text-sm">
                                  swap_horiz
                                </span>
                                Reassign
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUnassign(item._id)}
                                disabled={assignMutation.isPending}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition-all disabled:opacity-50"
                              >
                                <span className="material-symbols-outlined text-sm">
                                  person_remove
                                </span>
                                Unassign
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setAssigningNumber(item)}
                              className="inline-flex items-center gap-1 rounded-lg border border-outline-variant/50 bg-surface-container-low px-2 py-1 text-[11px] font-bold text-on-surface hover:bg-primary hover:text-on-primary transition-all"
                            >
                              <span className="material-symbols-outlined text-sm">
                                person_add
                              </span>
                              Assign
                            </button>
                          )}
                        </Can>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Number Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <h3 className="font-headline-sm text-base font-bold text-on-surface">
                Add Stringee Number
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant">
                  Phone Number *
                </label>
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
                <label className="text-xs font-bold text-on-surface-variant">
                  Label (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Delhi Desk 1"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-xs focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant">
                  Assign to Branch (Optional)
                </label>
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
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-outline-variant/50 px-4 py-2 text-xs font-bold text-on-surface hover:bg-surface-container-low transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary hover:opacity-95 transition-all disabled:opacity-50"
                >
                  {createMutation.isPending ? "Adding..." : "Add Number"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Number Info Modal */}
      <EditNumberModal
        editingNumber={editingNumber}
        onClose={() => setEditingNumber(null)}
        isPending={updateMutation.isPending}
        onUpdate={(payload) => {
          updateMutation.mutate(
            { numberId: payload?.numberId, payload },
            {
              onSuccess: () => setEditingNumber(null),
            },
          );
        }}
      />

      {/* Employee Assign / Reassign Modal */}
      {/* Employee Assign / Reassign Modal */}
      <AssignNumberModal
        assigningNumber={assigningNumber}
        onClose={() => setAssigningNumber(null)}
        isPending={assignMutation.isPending}
        onAssign={(payload) => {
          assignMutation.mutate(payload, {
            onSuccess: () => setAssigningNumber(null),
          });
        }}
      />
    </div>
  );
};

export default StringeeNumbersPage;
