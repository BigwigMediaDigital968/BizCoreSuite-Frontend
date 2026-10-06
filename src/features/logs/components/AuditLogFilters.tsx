import { AUDIT_ACTION_OPTIONS, AUDIT_ENTITY_OPTIONS } from "../constants";
import type { AuditLogQueryParams } from "@/types/audit";

interface Props {
  filters: AuditLogQueryParams;
  onChange: (next: AuditLogQueryParams) => void;
  onReset: () => void;
}

const AuditLogFilters = ({ filters, onChange, onReset }: Props) => {
  const hasActiveFilters = Boolean(
    filters.action || filters.entity || filters.from || filters.to
  );

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      
      {/* Action Filter */}
      <div className="relative">
        <select
          value={filters.action ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              action: e.target.value || undefined,
              page: 1,
            })
          }
          className="w-full appearance-none rounded-xl border border-outline-variant/50 bg-surface-container-low px-4 py-2.5 pr-10 font-label-md text-xs font-semibold text-on-surface outline-none focus:border-primary transition-all cursor-pointer"
        >
          <option value="">All actions</option>
          {AUDIT_ACTION_OPTIONS.map((action) => (
            <option key={action} value={action}>
              {action.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xl text-on-surface-variant">
          expand_more
        </span>
      </div>

      {/* Entity Filter */}
      <div className="relative">
        <select
          value={filters.entity ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              entity: e.target.value || undefined,
              page: 1,
            })
          }
          className="w-full appearance-none rounded-xl border border-outline-variant/50 bg-surface-container-low px-4 py-2.5 pr-10 font-label-md text-xs font-semibold text-on-surface outline-none focus:border-primary transition-all cursor-pointer"
        >
          <option value="">All entities</option>
          {AUDIT_ENTITY_OPTIONS.map((entity) => (
            <option key={entity} value={entity}>
              {entity}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xl text-on-surface-variant">
          expand_more
        </span>
      </div>

      {/* Date Range Inputs */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="date"
            value={filters.from?.slice(0, 10) ?? ""}
            max={filters.to?.slice(0, 10)}
            onChange={(e) =>
              onChange({
                ...filters,
                from: e.target.value
                  ? new Date(e.target.value).toISOString()
                  : undefined,
                page: 1,
              })
            }
            className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-low px-3 py-2 font-label-md text-xs text-on-surface outline-none focus:border-primary transition-all cursor-pointer"
          />
        </div>

        <span className="font-body-sm text-xs text-on-surface-variant shrink-0">to</span>

        <div className="relative">
          <input
            type="date"
            value={filters.to?.slice(0, 10) ?? ""}
            min={filters.from?.slice(0, 10)}
            onChange={(e) =>
              onChange({
                ...filters,
                to: e.target.value
                  ? new Date(e.target.value).toISOString()
                  : undefined,
                page: 1,
              })
            }
            className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-low px-3 py-2 font-label-md text-xs text-on-surface outline-none focus:border-primary transition-all cursor-pointer"
          />
        </div>
      </div>

      {/* Sort Order */}
      <div className="relative">
        <select
          value={filters.sortOrder ?? "desc"}
          onChange={(e) =>
            onChange({
              ...filters,
              sortOrder: e.target.value as "asc" | "desc",
            })
          }
          className="w-full appearance-none rounded-xl border border-outline-variant/50 bg-surface-container-low px-4 py-2.5 pr-10 font-label-md text-xs font-semibold text-on-surface outline-none focus:border-primary transition-all cursor-pointer"
        >
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>
        <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xl text-on-surface-variant">
          expand_more
        </span>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 rounded-xl border border-error/20 bg-error/10 px-3.5 py-2 font-label-md text-xs font-bold text-error hover:bg-error/20 transition-all shrink-0 lg:ml-auto"
        >
          <span className="material-symbols-outlined text-base">close</span>
          Clear filters
        </button>
      )}
    </div>
  );
};

export default AuditLogFilters;