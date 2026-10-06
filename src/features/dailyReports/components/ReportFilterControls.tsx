import { useScopedBranches } from "../hooks/useScopedBranches";
import { filterControlClass as controlClass } from "../utils";

export const BranchSelect = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (branchId: string) => void;
}) => {
  const branches = useScopedBranches();
  if (branches.length <= 1) return null;

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Branch"
      className={controlClass}
    >
      <option value="">All branches</option>
      {branches.map((branch) => (
        <option key={branch._id} value={branch._id}>
          {branch.name}
        </option>
      ))}
    </select>
  );
};

export const DateRange = ({
  startDate,
  endDate,
  onChange,
}: {
  startDate: string;
  endDate: string;
  onChange: (range: { startDate: string; endDate: string }) => void;
}) => (
  <div className="flex items-center gap-1.5">
    <input
      type="date"
      value={startDate}
      max={endDate}
      onChange={(e) => onChange({ startDate: e.target.value, endDate })}
      aria-label="From date"
      className={controlClass}
    />
    <span className="text-xs text-on-surface-variant">to</span>
    <input
      type="date"
      value={endDate}
      min={startDate}
      onChange={(e) => onChange({ startDate, endDate: e.target.value })}
      aria-label="To date"
      className={controlClass}
    />
  </div>
);

export const ToggleChip = ({
  label,
  active,
  onToggle,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
}) => (
  <button
    type="button"
    onClick={onToggle}
    aria-pressed={active}
    className={`rounded-xl px-3.5 py-2 font-label-sm text-xs font-bold transition-all ${
      active
        ? "bg-primary text-on-primary shadow-sm"
        : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
    }`}
  >
    {label}
  </button>
);
