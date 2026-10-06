import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Can } from "@/components/Auth/Can";
import { branchKeys, useBranchesQuery, useUpdateBranchStatus } from "../hooks/useBranches";
import RefreshButton from "@/components/ui/RefreshButton";
import type { Branch } from "@/types/branch";

const BranchListPage = () => {
  const navigate = useNavigate();
  const { data: branches, isLoading, isError } = useBranchesQuery();
  const updateStatus = useUpdateBranchStatus();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusTarget, setStatusTarget] = useState<Branch | null>(null);

  const filteredBranches = useMemo(() => {
    if (!branches) return [];
    const query = searchQuery.trim().toLowerCase();
    if (!query) return branches;
    return branches.filter(
      (branch) =>
        branch.name.toLowerCase().includes(query) ||
        branch.code?.toLowerCase().includes(query) ||
        branch.city?.toLowerCase().includes(query)
    );
  }, [branches, searchQuery]);

  const handleConfirmStatusChange = async () => {
    if (!statusTarget) return;
    await updateStatus.mutateAsync({
      id: statusTarget._id,
      isActive: !statusTarget.isActive,
    });
    setStatusTarget(null);
  };

  return (
    <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs tracking-wider uppercase mb-1">
            <span className="h-0.5 w-4 bg-primary rounded-full" />
            <span>Operations</span>
          </div>
          <h1 className="font-headline-md text-2xl sm:text-3xl font-extrabold text-on-surface">
            Branch Network
          </h1>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1 max-w-2xl">
            View and manage every regional office your organization operates from.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <RefreshButton queryKey={branchKeys.all} />

          <Can permission="branch:create">
            <button
              onClick={() => navigate("/branches/new")}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-label-md text-xs font-bold text-on-primary shadow-sm hover:bg-primary/90 transition-all shrink-0"
            >
              <span className="material-symbols-outlined text-lg">add_business</span>
              <span>Create Branch</span>
            </button>
          </Can>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-md items-center rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3.5 py-2.5 shadow-xs focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-xl text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            placeholder="Search by name, code, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent pl-8 font-body-sm text-xs sm:text-sm text-on-surface outline-none placeholder:text-on-surface-variant/60"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest animate-pulse"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-error/30 bg-error/10 p-8 text-center">
          <span className="material-symbols-outlined text-3xl text-error">error</span>
          <p className="font-body-md text-sm text-error mt-2">
            Failed to load branches. Please try again.
          </p>
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-12 text-center">
          <span className="material-symbols-outlined text-4xl text-outline-variant">
            domain
          </span>
          <p className="font-body-md text-on-surface-variant mt-2">
            No branches found matching your search.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-xs">
          <table className="w-full text-left border-collapse font-body-sm text-xs">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-low/50 font-label-sm text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                <th className="py-4 px-6">Branch Code</th>
                <th className="py-4 px-6">Location</th>
                <th className="py-4 px-6 text-center">Team Size</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filteredBranches.map((branch) => (
                <tr
                  key={branch._id}
                  className="hover:bg-surface-container-low/40 transition-colors cursor-pointer"
                  onClick={() => navigate(`/branches/${branch._id}`)}
                >
                  <td className="py-4 px-6 font-mono font-extrabold text-xs text-on-surface">
                    {branch.code}
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-bold text-sm text-on-surface hover:text-primary transition-colors">
                      {branch.name}
                    </p>
                    <p className="text-on-surface-variant text-xs mt-0.5">
                      {[branch.address, branch.city, branch.state, branch.country]
                        .filter(Boolean)
                        .join(", ") || "Address not provided"}
                    </p>
                  </td>
                  <td className="py-4 px-6 text-center font-bold text-on-surface">
                    {branch?.teamSize ?? "—"}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-3 py-1 font-label-sm text-[10px] font-extrabold uppercase tracking-wider ${
                        branch.isActive
                          ? "bg-emerald-500/10 text-emerald-700"
                          : "bg-blue-500/10 text-blue-700"
                      }`}
                    >
                      {branch.isActive ? "Active" : "Setup Phase"}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <Can permission="branch:view">
                        <button
                          onClick={() => navigate(`/branches/${branch._id}`)}
                          className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                          title="View Details"
                        >
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </button>
                      </Can>
                      <Can permission="branch:update">
                        <button
                          onClick={() => navigate(`/branches/${branch._id}/edit`)}
                          className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                          title="Edit Branch"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        {/* Status toggle is a branch:update action on the backend,
                            not branch:delete — kept under the same permission gate. */}
                        <button
                          onClick={() => setStatusTarget(branch)}
                          className={`rounded-lg p-1.5 transition-colors ${
                            branch.isActive
                              ? "text-error hover:bg-error/10"
                              : "text-emerald-700 hover:bg-emerald-500/10"
                          }`}
                          title={branch.isActive ? "Deactivate" : "Activate"}
                        >
                          <span className="material-symbols-outlined text-lg">
                            {branch.isActive ? "toggle_off" : "toggle_on"}
                          </span>
                        </button>
                      </Can>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Status toggle stays a lightweight confirm modal — it's a single yes/no
          action, not a navigable flow, so a page would be overkill here. */}
      <ConfirmDialog
        open={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleConfirmStatusChange}
        isLoading={updateStatus.isPending}
        tone={statusTarget?.isActive ? "danger" : "primary"}
        title={statusTarget?.isActive ? "Deactivate Branch?" : "Activate Branch?"}
        description={
          statusTarget?.isActive
            ? `${statusTarget?.name} will stop appearing in active branch lists and new employees can no longer be assigned to it.`
            : `${statusTarget?.name} will become available again for assignments.`
        }
        confirmLabel={statusTarget?.isActive ? "Deactivate" : "Activate"}
      />
    </div>
  );
};

export default BranchListPage;