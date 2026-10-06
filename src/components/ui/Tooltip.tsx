import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  className?: string;
  width?: number;
}

const GAP = 8;
const EDGE = 8;
/** Rough height used to decide whether the tip fits below the trigger. */
const ESTIMATED_HEIGHT = 90;

/**
 * Hover/focus tooltip rendered in a portal with fixed positioning, so it's
 * never clipped by (or widens) a scrolling table or card. The trigger is a
 * button, so keyboard users get the tip on focus; Escape closes it.
 */
const Tooltip = ({ content, children, className = "", width = 240 }: TooltipProps) => {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; above: boolean } | null>(null);

  const show = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const left = Math.min(
      Math.max(rect.left + rect.width / 2 - width / 2, EDGE),
      window.innerWidth - width - EDGE
    );
    const above = rect.bottom + GAP + ESTIMATED_HEIGHT > window.innerHeight;
    setPosition({ top: above ? rect.top - GAP : rect.bottom + GAP, left, above });
  };

  const hide = () => setPosition(null);

  // A fixed tip would drift away from its trigger on scroll, so close it.
  useEffect(() => {
    if (!position) return;
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, [position]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-describedby={position ? id : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onKeyDown={(e) => e.key === "Escape" && hide()}
        className={`cursor-help rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${className}`}
      >
        {children}
      </button>
      {position &&
        createPortal(
          <div
            role="tooltip"
            id={id}
            style={{
              top: position.top,
              left: position.left,
              width,
              transform: position.above ? "translateY(-100%)" : undefined,
            }}
            className="pointer-events-none fixed z-[120] whitespace-normal rounded-lg bg-inverse-surface px-3 py-2 text-left text-[11px] font-medium normal-case leading-snug tracking-normal text-inverse-on-surface shadow-lg"
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
};

export default Tooltip;
