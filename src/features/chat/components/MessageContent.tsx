import { useMemo } from "react";
import type { ChatParticipant } from "@/types/chat";
import { parseMessage } from "../utils/mentions";
import { useNavigate } from "react-router";
import { ROUTES } from "@/config/routes";

interface MessageContentProps {
  content: string;
  members: ChatParticipant[];
  currentUserId?: string;
  /** The bubble is purple (my own message), so highlights need a light tint. */
  onDarkBubble: boolean;
}

/**
 * Message text with @mentions highlighted. Parts are rendered as React text
 * nodes (never as HTML), so message content can't inject markup.
 */
const MessageContent = ({
  content,
  members,
  currentUserId,
  onDarkBubble,
}: MessageContentProps) => {
  const navigate = useNavigate();
  const parts = useMemo(() => parseMessage(content), [content]);
  // Show the person's current name, not the one frozen into the token.
  const nameById = useMemo(
    () => new Map(members.map((m) => [m._id, m.name])),
    [members]
  );

  // Opens that person's direct message (created on first use).
  const openDirectMessage = (userId: string) =>
    navigate(`${ROUTES.chat}/dm/${userId}`);

  return (
    <>
      {parts.map((part, i) => {
        if (part.type === "text") return <span key={i}>{part.text}</span>;

        const isMe = part.userId === currentUserId;
        const tone = onDarkBubble
          ? "bg-white/25 text-white"
          : isMe
            ? "bg-amber-100 text-amber-800"
            : "bg-purple-100 text-purple-700";

        const label = `@${nameById.get(part.userId) ?? part.name}`;
        const className = `rounded px-1 font-semibold ${tone}`;

        // You can't message yourself, so your own tag is just highlighted.
        if (isMe) {
          return (
            <span key={i} className={className} data-mention-id={part.userId}>
              {label}
            </span>
          );
        }

        return (
          <button
            key={i}
            type="button"
            onClick={() => openDirectMessage(part.userId)}
            title={`Message ${label.slice(1)}`}
            className={`${className} cursor-pointer hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-purple-500`}
            data-mention-id={part.userId}
          >
            {label}
          </button>
        );
      })}
    </>
  );
};

export default MessageContent;
