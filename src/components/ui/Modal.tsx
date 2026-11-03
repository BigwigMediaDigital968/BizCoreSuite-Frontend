import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /**
   * Actions pinned below the content. With a footer the dialog stays within
   * the screen and only the body scrolls, so the buttons are always visible.
   * Submit buttons here need `form="<form id>"` to submit a form in the body.
   */
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  /**
   * "top" pins the dialog's top edge near the top of the screen instead of
   * centering it. Use it when the content changes height (wizard steps), so
   * the header doesn't jump.
   */
  align?: "center" | "top";
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
  footer,
  size = "md",
  align = "center",
}: ModalProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  // Callers pass inline handlers. Reading the latest through a ref keeps the
  // effect below tied to `open` only, so a re-render never moves focus.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // What opened the dialog, so focus can go back there on close. It has to be
  // read while rendering: by the time effects run, a child's `autoFocus` has
  // already moved focus into the dialog.
  const triggerRef = useRef<HTMLElement | null>(null);
  if (!open) triggerRef.current = null;
  else if (!triggerRef.current)
    triggerRef.current = document.activeElement as HTMLElement | null;

  // Close on Escape, keep Tab inside the dialog, and stop the page behind it
  // from scrolling.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (
        e.shiftKey &&
        (active === first || !dialogRef.current.contains(active))
      ) {
        e.preventDefault();
        last.focus();
      } else if (
        !e.shiftKey &&
        (active === last || !dialogRef.current.contains(active))
      ) {
        e.preventDefault();
        first.focus();
      }
    };

    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    // Move focus in unless a child already took it (e.g. autoFocus).
    if (!dialogRef.current?.contains(document.activeElement)) {
      dialogRef.current?.focus();
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      // Hand focus back to whatever opened the dialog.
      trigger?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  // Rendered through a portal: any ancestor with a transform, filter or
  // backdrop-filter (e.g. the blurred floating action bars) becomes the
  // containing block for `position: fixed`, which would clip the dialog to
  // that element's box instead of the viewport.
  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* `min-h-full` + centering inside the scroll area: a dialog taller than
          the screen grows the area instead of having its top cut off. A press
          on the empty margin (not a text-selection drag that ends there)
          closes it. */}
      <div
        className={`relative flex min-h-full items-start justify-center p-4 ${
          align === "center" ? "sm:items-center" : "sm:pt-[6vh]"
        }`}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          ref={dialogRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className={`relative w-full focus:outline-none ${SIZE_CLASSES[size]} rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-2xl ${
            footer
              ? `flex flex-col ${
                  // Leave room for the top offset so the bottom edge stays on screen.
                  align === "top"
                    ? "max-h-[calc(94dvh-1rem)]"
                    : "max-h-[calc(100dvh-2rem)]"
                }`
              : "my-4"
          }`}
        >
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-outline-variant/20 p-5">
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

          <div
            className={footer ? "min-h-0 flex-1 overflow-y-auto p-5" : "p-5"}
          >
            {children}
          </div>

          {footer && (
            <div className="shrink-0 rounded-b-2xl border-t border-outline-variant/20 bg-surface-container-lowest px-5 py-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
