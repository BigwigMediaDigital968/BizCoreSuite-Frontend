import type { CSSProperties } from "react";
import type { ChatParticipant } from "@/types/chat";
import { initials, roleLabel } from "../utils/format";

export const mentionOptionId = (userId: string) => `mention-option-${userId}`;

interface MentionPopoverProps {
  candidates: ChatParticipant[];
  activeIndex: number;
  /** Where the popover's bottom-left corner goes, inside its `relative` parent. */
  anchor: { left: number; top: number };
  onPick: (user: ChatParticipant) => void;
  onHover: (index: number) => void;
}

/** Suggestion list shown just above the caret while typing `@name`. */
const MentionPopover = ({
  candidates,
  activeIndex,
  anchor,
  onPick,
  onHover,
}: MentionPopoverProps) => (
  <ul
    id="mention-listbox"
    role="listbox"
    aria-label="Mention a member"
    style={
      {
        left: anchor.left,
        top: anchor.top,
        // Grow upward from the anchor, with a small gap above the text line.
        transform: "translateY(calc(-100% - 6px))",
      } satisfies CSSProperties
    }
    className="absolute z-10 max-h-56 w-72 max-w-[calc(100%-1.5rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
  >
    {candidates.map((user, i) => (
      <li
        key={user._id}
        id={mentionOptionId(user._id)}
        role="option"
        aria-selected={i === activeIndex}
        // mousedown (not click) so the textarea keeps focus.
        onMouseDown={(e) => {
          e.preventDefault();
          onPick(user);
        }}
        onMouseEnter={() => onHover(i)}
        className={`flex cursor-pointer items-center gap-2 px-3 py-2 ${
          i === activeIndex ? "bg-purple-50" : ""
        }`}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[10px] font-semibold text-purple-700">
          {initials(user.name)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-slate-800">
            {user.name}
          </span>
          <span className="block truncate text-xs text-slate-500">
            {roleLabel(user.role)}
          </span>
        </span>
      </li>
    ))}
  </ul>
);

export default MentionPopover;
