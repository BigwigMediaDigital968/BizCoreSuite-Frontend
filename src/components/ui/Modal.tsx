import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
};

const Modal = ({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
}: ModalProps) => {
  // Close on Escape, and stop the page behind the dialog from scrolling.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  // Rendered through a portal: any ancestor with a transform, filter or
  // backdrop-filter (e.g. the blurred floating action bars) becomes the
  // containing block for `position: fixed`, which would clip the dialog to
  // that element's box instead of the viewport.
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative w-full ${SIZE_CLASSES[size]} my-8 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-2xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant/20 p-5">
          <div className="space-y-0.5">
            <h2
              id="modal-title"
              className="font-headline-sm text-base font-bold text-on-surface"
            >
              {title}
            </h2>
            {description && (
              <p className="font-body-sm text-xs text-on-surface-variant">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
