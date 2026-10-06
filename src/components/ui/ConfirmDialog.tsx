import Modal from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  isLoading?: boolean;
}

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
  isLoading = false,
}: ConfirmDialogProps) => {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      {description && (
        <p className="font-body-md text-sm text-on-surface-variant mb-6">
          {description}
        </p>
      )}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="rounded-xl px-4 py-2.5 font-label-md text-xs font-bold text-on-surface-variant hover:bg-surface-container hover:text-on-surface disabled:opacity-50 transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 font-label-md text-xs font-bold text-on-primary shadow-sm disabled:opacity-50 transition-all ${
            tone === "danger"
              ? "bg-error hover:bg-error/90"
              : "bg-primary hover:bg-primary/90"
          }`}
        >
          {isLoading && (
            <span className="material-symbols-outlined text-base animate-spin">
              progress_activity
            </span>
          )}
          <span>{isLoading ? "Please wait…" : confirmLabel}</span>
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
