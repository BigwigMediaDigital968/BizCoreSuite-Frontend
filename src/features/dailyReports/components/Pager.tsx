import type { Pagination } from "@/types/employee";

interface PagerProps {
  pagination?: Pagination;
  noun: string;
  onPageChange: (page: number) => void;
}

/** Table footer pager, same look as the leave and attendance tables. */
const Pager = ({ pagination, noun, onPageChange }: PagerProps) => {
  if (!pagination || pagination.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-outline-variant/20 px-4 py-3">
      <p className="font-body-sm text-[11px] text-on-surface-variant">
        Page {pagination.page} of {pagination.totalPages} · {pagination.total}{" "}
        {noun}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(pagination.page - 1, 1))}
          disabled={pagination.page <= 1}
          aria-label="Previous page"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
        >
          <span className="material-symbols-outlined text-lg">chevron_left</span>
        </button>
        <button
          type="button"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages}
          aria-label="Next page"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
        >
          <span className="material-symbols-outlined text-lg">chevron_right</span>
        </button>
      </div>
    </div>
  );
};

export default Pager;
