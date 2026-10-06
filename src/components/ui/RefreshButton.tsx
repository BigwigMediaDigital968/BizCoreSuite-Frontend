import { useIsFetching, useQueryClient, type QueryKey } from "@tanstack/react-query";

interface RefreshButtonProps {
  /**
   * Key prefix to invalidate. React Query matches prefixes by default, so
   * passing a feature's `all` key refreshes every paginated/filtered variant
   * currently in the cache.
   */
  queryKey: QueryKey;
  /** Optional text beside the icon; icon-only when omitted. */
  label?: string;
  className?: string;
}

const RefreshButton = ({ queryKey, label, className = "" }: RefreshButtonProps) => {
  const queryClient = useQueryClient();
  const isFetching = useIsFetching({ queryKey }) > 0;

  return (
    <button
      type="button"
      onClick={() => queryClient.invalidateQueries({ queryKey })}
      disabled={isFetching}
      title="Refresh"
      aria-label="Refresh"
      className={`flex items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3.5 py-2.5 font-label-md text-xs font-bold text-on-surface-variant hover:bg-surface-container hover:text-on-surface disabled:opacity-60 transition-colors ${className}`}
    >
      <span
        className={`material-symbols-outlined text-base ${isFetching ? "animate-spin" : ""}`}
      >
        refresh
      </span>
      {label && <span>{isFetching ? "Refreshing…" : label}</span>}
    </button>
  );
};

export default RefreshButton;
