import { useState } from "react";
import { useLeads } from "@/features/leads";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { Lead } from "@/types/lead";

/** Loose enough to accept either a full `Lead` or the slim `TaskLeadSummary`
 * the tasks API populates onto `task.leads` (which has no phoneCountryCode). */
interface LeadSummaryLike {
  _id: string;
  name: string;
  phone: string;
  phoneCountryCode?: string;
  status: string;
}

interface LeadPickerProps {
  branchId: string;
  selectedLeads: LeadSummaryLike[];
  onAdd: (lead: Lead) => void;
  onRemove: (leadId: string) => void;
  disabled?: boolean;
}

/**
 * Multi-select search-picker for linking a task to one or more leads.
 * Scoped to `branchId` because the backend rejects a lead that doesn't
 * belong to the task's branch (task.service.ts createTask/updateTask:
 * "All leads must belong to the task's assigned branch").
 */
const LeadPicker = ({ branchId, selectedLeads, onAdd, onRemove, disabled }: LeadPickerProps) => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [isOpen, setIsOpen] = useState(false);

  const { data, isLoading } = useLeads({
    branchId: branchId || undefined,
    search: debouncedSearch || undefined,
    limit: 8,
  });

  const selectedIds = new Set(selectedLeads.map((l) => l._id));
  const results = (data?.leads ?? []).filter((lead) => !selectedIds.has(lead._id));

  return (
    <div className="space-y-1.5">
      {selectedLeads.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedLeads.map((lead) => (
            <span
              key={lead._id}
              className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant/40 bg-surface-container-low px-2.5 py-1.5"
            >
              <span className="min-w-0">
                <span className="block truncate text-xs font-bold text-on-surface">{lead.name}</span>
                <span className="block truncate text-[10px] text-on-surface-variant/70">
                  {lead.phoneCountryCode ?? ""} {lead.phone} &middot; {lead.status}
                </span>
              </span>
              <button
                type="button"
                onClick={() => onRemove(lead._id)}
                disabled={disabled}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-on-surface-variant hover:bg-surface-container hover:text-rose-600 disabled:opacity-50"
                title="Unlink lead"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-base text-on-surface-variant/50">
          search
        </span>
        <input
          type="text"
          disabled={disabled || !branchId}
          placeholder={!branchId ? "Select a branch first" : "Search leads by name or phone..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low pl-8 pr-3 py-2 text-xs font-medium text-on-surface outline-none focus:border-primary disabled:opacity-50"
        />
      </div>

      {branchId && isOpen && (
        <div className="max-h-40 overflow-y-auto rounded-xl border border-outline-variant/30 divide-y divide-outline-variant/20">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <span className="material-symbols-outlined animate-spin text-lg text-primary">
                progress_activity
              </span>
            </div>
          ) : results.length === 0 ? (
            <p className="py-4 text-center text-[11px] text-on-surface-variant/70">
              {data?.leads.length ? "All matching leads are already linked." : "No leads found in this branch."}
            </p>
          ) : (
            results.map((lead) => (
              <button
                key={lead._id}
                type="button"
                // Keep focus on the search input across the click so the
                // dropdown doesn't blur-close before onClick fires — lets
                // users add several leads in a row without re-focusing.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onAdd(lead);
                  setSearch("");
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-surface-container-low transition-colors"
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-on-surface">{lead.name}</span>
                  <span className="block truncate text-[10px] text-on-surface-variant/70">
                    {lead.phoneCountryCode} {lead.phone} &middot; {lead.status}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default LeadPicker;
