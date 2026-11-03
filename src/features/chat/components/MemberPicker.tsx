import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { ROLE_LABELS, ROLES, type Role } from "@/types/auth";
import type { ChannelCandidate } from "../api/chatApi";
import { initials } from "../utils/format";

interface BranchOption {
  _id: string;
  name: string;
}

interface MemberPickerProps {
  people: ChannelCandidate[];
  branches: BranchOption[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  /** Id of the element describing a validation error, if there is one. */
  describedBy?: string;
  invalid?: boolean;
  /**
   * Branch the list opens filtered to ("" = all). It follows this prop, so
   * choosing a branch elsewhere narrows the list; the user can still widen it.
   */
  presetBranchId?: string;
}

const selectClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500";

const roleLabel = (role: string) => ROLE_LABELS[role as Role] ?? role;

/**
 * Pick channel members from the whole organisation. Search and the branch /
 * role filters narrow the list; "Select all shown" then adds exactly that
 * slice, which is how you add a whole team in two clicks.
 */
const MemberPicker = ({
  people,
  branches,
  selected,
  onChange,
  describedBy,
  invalid,
  presetBranchId = "",
}: MemberPickerProps) => {
  const [search, setSearch] = useState("");
  const [branchId, setBranchId] = useState(presetBranchId);
  useEffect(() => {
    setBranchId(presetBranchId);
  }, [presetBranchId]);
  const [role, setRole] = useState("");
  const [selectedOnly, setSelectedOnly] = useState(false);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return people.filter((p) => {
      if (selectedOnly && !selected.has(p._id)) return false;
      if (role && p.role !== role) return false;
      if (branchId && !p.branches.some((b) => b._id === branchId)) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.email.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [people, search, branchId, role, selectedOnly, selected]);

  const visibleSelected = visible.filter((p) => selected.has(p._id)).length;
  const allShownSelected = visible.length > 0 && visibleSelected === visible.length;
  const someShownSelected = visibleSelected > 0 && !allShownSelected;
  const filtered = !!(search.trim() || branchId || role || selectedOnly);

  // `indeterminate` can only be set from script.
  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someShownSelected;
  }, [someShownSelected]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  const toggleAllShown = () => {
    const next = new Set(selected);
    for (const p of visible) {
      if (allShownSelected) next.delete(p._id);
      else next.add(p._id);
    }
    onChange(next);
  };

  const clearFilters = () => {
    setSearch("");
    setBranchId("");
    setRole("");
    setSelectedOnly(false);
  };

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="member-search" className="sr-only">
          Search people by name or email
        </label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400"
          />
          <input
            id="member-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            // Enter here means "run the search", not "go to the next step".
            onKeyDown={(e) => {
              if (e.key === "Enter") e.preventDefault();
            }}
            placeholder="Search by name or email"
            autoComplete="off"
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="member-branch" className="mb-1 block text-xs font-medium text-slate-600">
            Branch
          </label>
          <select
            id="member-branch"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className={selectClass}
          >
            <option value="">All branches</option>
            {branches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="member-role" className="mb-1 block text-xs font-medium text-slate-600">
            Role
          </label>
          <select
            id="member-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={selectClass}
          >
            <option value="">All roles</option>
            {Object.values(ROLES).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
          <input
            ref={selectAllRef}
            type="checkbox"
            checked={allShownSelected}
            disabled={visible.length === 0}
            onChange={toggleAllShown}
            className="h-4 w-4 accent-purple-600"
          />
          {filtered ? `Select all ${visible.length} shown` : `Select everyone (${visible.length})`}
        </label>

        <div className="flex items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={selectedOnly}
              onChange={(e) => setSelectedOnly(e.target.checked)}
              className="h-4 w-4 accent-purple-600"
            />
            Selected only
          </label>
          <button
            type="button"
            onClick={() => onChange(new Set())}
            disabled={selected.size === 0}
            className="rounded text-sm font-medium text-purple-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
          >
            Clear all
          </button>
        </div>
      </div>

      <div
        role="group"
        aria-label="People"
        className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white"
      >
        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <p className="text-sm font-medium text-slate-700">
              {people.length === 0 ? "No other people to add yet" : "No one matches these filters"}
            </p>
            {filtered && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 rounded text-sm font-medium text-purple-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {visible.map((p) => (
              <li key={p._id}>
                <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-slate-50 has-[:checked]:bg-purple-50/60 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-inset has-[:focus-visible]:ring-purple-500">
                  <input
                    type="checkbox"
                    checked={selected.has(p._id)}
                    onChange={() => toggle(p._id)}
                    className="h-4 w-4 shrink-0 accent-purple-600 focus:outline-none"
                  />
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600"
                  >
                    {initials(p.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800">
                      {p.name}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {roleLabel(p.role)}
                      {p.branches.length > 0 && ` · ${p.branches.map((b) => b.name).join(", ")}`}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p aria-live="polite" className="text-xs text-slate-500">
        <span className="font-semibold text-slate-700">{selected.size}</span>{" "}
        {selected.size === 1 ? "person" : "people"} selected
        {filtered && ` · showing ${visible.length} of ${people.length}`}
      </p>
    </div>
  );
};

export default MemberPicker;
