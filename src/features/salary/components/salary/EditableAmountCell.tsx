import { useState } from "react";

import type { PayoutOverride } from "@/types/salary";
import { inr } from "../../utils";

interface EditableAmountCellProps {
  value: number;
  /** Present when Head has overridden this amount. */
  override?: PayoutOverride;
  /** Omit for a read-only cell (payout detail). */
  onSave?: (value: number, reason: string) => void;
  onReset?: () => void;
  emphasis?: boolean;
}

/**
 * An amount in the payout breakdown. In the preview, Head can replace it
 * with a manual value (a reason is required); the calculated value stays
 * visible, struck through, so the change is never hidden.
 */
const EditableAmountCell = ({
  value,
  override,
  onSave,
  onReset,
  emphasis,
}: EditableAmountCellProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [reason, setReason] = useState("");

  const startEdit = () => {
    setDraft(String(value));
    setReason(override?.reason ?? "");
    setEditing(true);
  };

  const parsed = Number(draft);
  const valid =
    draft.trim() !== "" && Number.isFinite(parsed) && parsed >= 0 && reason.trim().length > 0;

  const save = () => {
    if (!valid || !onSave) return;
    onSave(Math.round(parsed * 100) / 100, reason.trim());
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <input
          type="number"
          min={0}
          step="0.01"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
          aria-label="New amount"
          className="w-32 rounded-lg border border-primary bg-surface-container-lowest px-2 py-1 text-right text-xs font-bold outline-none"
        />
        <input
          type="text"
          value={reason}
          maxLength={300}
          onChange={(e) => setReason(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setEditing(false);
          }}
          placeholder="Reason (required)"
          aria-label="Reason for the change"
          className="w-48 rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-2 py-1 text-[11px] outline-none focus:border-primary"
        />
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg px-2 py-1 text-[11px] font-bold text-on-surface-variant hover:bg-surface-container"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!valid}
            className="rounded-lg bg-primary px-2.5 py-1 text-[11px] font-bold text-on-primary disabled:opacity-40"
          >
            Apply
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      {override && (
        <span
          className="text-[11px] text-on-surface-variant/60 line-through"
          title="Calculated value"
        >
          {inr(override.calculated)}
        </span>
      )}
      <span
        title={override ? `Edited: ${override.reason}` : undefined}
        className={`tabular-nums ${emphasis ? "font-extrabold" : "font-semibold"} ${
          override ? "rounded-md bg-amber-500/15 px-1.5 py-0.5 text-amber-700" : ""
        }`}
      >
        {inr(value)}
      </span>
      {onSave && (
        <button
          type="button"
          onClick={startEdit}
          aria-label="Edit amount"
          className="flex h-6 w-6 items-center justify-center rounded-md text-on-surface-variant/60 hover:bg-surface-container hover:text-primary"
        >
          <span className="material-symbols-outlined text-sm">edit</span>
        </button>
      )}
      {override && onReset && (
        <button
          type="button"
          onClick={onReset}
          aria-label="Reset to calculated value"
          title="Reset to calculated value"
          className="flex h-6 w-6 items-center justify-center rounded-md text-on-surface-variant/60 hover:bg-surface-container hover:text-error"
        >
          <span className="material-symbols-outlined text-sm">restart_alt</span>
        </button>
      )}
    </div>
  );
};

export default EditableAmountCell;
