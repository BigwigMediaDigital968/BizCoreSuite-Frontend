import {
  Fragment,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { AlertCircle, ArrowLeft, Hash, Lock, Send } from "lucide-react";
import type { ChatMessage, ChatParticipant, ChatRoom } from "@/types/chat";
import { useRoomMessages } from "../hooks/useChat";
import MentionPopover, { mentionOptionId } from "./MentionPopover";
import MessageContent from "./MessageContent";
import { getTextareaCaretPosition } from "../utils/caret";
import { toMentionTokens, type Mentionable } from "../utils/mentions";
import {
  dayLabel,
  initials,
  isSameDay,
  roleLabel,
  roomTitle,
  timeLabel,
} from "../utils/format";

const MAX_MESSAGE_LENGTH = 4000;
// Consecutive messages from one person within this gap share a header.
const GROUP_GAP_MS = 5 * 60 * 1000;
// "Near the bottom" — keep following new messages.
const STICK_THRESHOLD_PX = 80;
const LOAD_OLDER_THRESHOLD_PX = 60;
const MAX_COMPOSER_HEIGHT_PX = 140;
const MAX_MENTION_SUGGESTIONS = 6;
const MENTION_POPOVER_WIDTH_PX = 288; // matches w-72 in MentionPopover
const MENTION_EDGE_GAP_PX = 12;
// `@` at the start or after whitespace, then the name typed so far. The
// whitespace rule keeps emails like a@b.com from opening the popover.
const MENTION_TRIGGER = /(^|\s)@([\w.\- ]{0,30})$/;

/** The `@query` being typed right before the caret, if any. */
interface MentionTrigger {
  start: number; // index of the "@"
  end: number; // caret position
  query: string;
}

const findMentionTrigger = (value: string, caret: number): MentionTrigger | null => {
  const match = MENTION_TRIGGER.exec(value.slice(0, caret));
  if (!match) return null;
  return { start: match.index + match[1].length, end: caret, query: match[2] };
};

interface ConversationProps {
  room: ChatRoom;
  currentUserId?: string;
  typingName?: string;
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: (content: string) => void;
  onRetry: (message: ChatMessage) => void;
  onDiscard: (message: ChatMessage) => void;
  onTyping: () => void;
  onBack: () => void;
  onOpenInfo: () => void;
  infoOpen: boolean;
}

const startsGroup = (messages: ChatMessage[], i: number) => {
  if (i === 0) return true;
  const prev = messages[i - 1];
  const cur = messages[i];
  return (
    prev.kind === "SYSTEM" ||
    prev.senderId._id !== cur.senderId._id ||
    !isSameDay(prev.createdAt, cur.createdAt) ||
    new Date(cur.createdAt).getTime() - new Date(prev.createdAt).getTime() >
      GROUP_GAP_MS
  );
};

const Conversation = ({
  room,
  currentUserId,
  typingName,
  draft,
  onDraftChange,
  onSend,
  onRetry,
  onDiscard,
  onTyping,
  onBack,
  onOpenInfo,
  infoOpen,
}: ConversationProps) => {
  const isDirect = room.type === "DIRECT";
  const readOnly = isDirect && !!room.readOnly;
  const creatorName = room.participants.find((p) => p._id === room.createdBy)?.name;

  const { data, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useRoomMessages(room._id);

  const messages = useMemo(
    () => (data ? [...data.pages].reverse().flatMap((p) => p.messages) : []),
    [data]
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const stickToBottom = useRef(true);
  // Set just before loading older messages, to keep the view in place.
  const restoreFrom = useRef<{ height: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const last = messages[messages.length - 1];

    if (restoreFrom.current) {
      el.scrollTop = el.scrollHeight - restoreFrom.current.height + restoreFrom.current.top;
      restoreFrom.current = null;
    } else if (stickToBottom.current || last?.senderId._id === currentUserId) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, currentUserId]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottom.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < STICK_THRESHOLD_PX;

    if (el.scrollTop < LOAD_OLDER_THRESHOLD_PX && hasNextPage && !isFetchingNextPage) {
      restoreFrom.current = { height: el.scrollHeight, top: el.scrollTop };
      fetchNextPage();
    }
  };

  // Grow the composer with its content, up to a limit.
  useLayoutEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_COMPOSER_HEIGHT_PX)}px`;
  }, [draft]);

  // --- @mention picker (channels only; a DM has just one other person) ---
  const [mention, setMention] = useState<MentionTrigger | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);

  const mentionCandidates = useMemo<ChatParticipant[]>(() => {
    if (!mention || isDirect) return [];
    const q = mention.query.trim().toLowerCase();
    return room.participants
      .filter((p) => p._id !== currentUserId && p.name.toLowerCase().includes(q))
      .slice(0, MAX_MENTION_SUGGESTIONS);
  }, [mention, isDirect, room.participants, currentUserId]);

  const mentionOpen = mentionCandidates.length > 0;
  // TODO(debug): remove
  console.log("[mention] render", {
    trigger: mention,
    participants: room.participants.map((p) => p.name),
    currentUserId,
    candidates: mentionCandidates.map((p) => p.name),
    mentionOpen,
  });
  const activeMentionIndex = Math.min(mentionIndex, mentionCandidates.length - 1);

  // Pin the popover just above the "@" being typed. Offsets are relative to
  // the composer <form>, which is the popover's positioned parent.
  const [mentionAnchor, setMentionAnchor] = useState({ left: 0, top: 0 });
  const mentionStart = mention?.start;
  useLayoutEffect(() => {
    const el = composerRef.current;
    const parent = el?.offsetParent as HTMLElement | null;
    if (!el || !parent || !mentionOpen || mentionStart === undefined) return;

    const caret = getTextareaCaretPosition(el, mentionStart);
    const maxLeft = parent.clientWidth - MENTION_POPOVER_WIDTH_PX - MENTION_EDGE_GAP_PX;
    setMentionAnchor({
      left: Math.max(
        MENTION_EDGE_GAP_PX,
        Math.min(el.offsetLeft + caret.left, maxLeft)
      ),
      top: el.offsetTop + caret.top,
    });
  }, [mentionOpen, mentionStart, draft]);

  const updateMention = (value: string, caret: number) => {
    const next = isDirect ? null : findMentionTrigger(value, caret);
    // TODO(debug): remove
    console.log("[mention] updateMention", {
      value,
      caret,
      roomType: room.type,
      isDirect,
      trigger: next,
    });
    setMention(next);
    setMentionIndex(0);
  };

  // People chosen from the popover, so two members sharing a name still tag
  // the right one. Names typed by hand are resolved from the member list.
  const pickedMentions = useRef(new Map<string, Mentionable>());

  const pickMention = (user: ChatParticipant) => {
    if (!mention) return;
    pickedMentions.current.set(user.name, { _id: user._id, name: user.name });
    const inserted = `@${user.name} `;
    onDraftChange(draft.slice(0, mention.start) + inserted + draft.slice(mention.end));
    setMention(null);

    // Put the caret right after the inserted name once React has re-rendered.
    const caret = mention.start + inserted.length;
    requestAnimationFrame(() => {
      const el = composerRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  };

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const content = draft.trim();
    if (!content || readOnly) return;
    stickToBottom.current = true;
    setMention(null);
    // Channels only: swap "@Name" for "@[Name](id)" so the server can store
    // who was tagged. A DM has no mentions, so text is sent untouched.
    onSend(
      isDirect
        ? content
        : toMentionTokens(
            content,
            [...pickedMentions.current.values()],
            room.participants.filter((p) => p._id !== currentUserId)
          )
    );
    pickedMentions.current.clear();
    onDraftChange("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // The open picker owns these keys, so Enter picks instead of sending.
    if (mentionOpen && !e.nativeEvent.isComposing) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const step = e.key === "ArrowDown" ? 1 : -1;
        setMentionIndex(
          (activeMentionIndex + step + mentionCandidates.length) %
            mentionCandidates.length
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        pickMention(mentionCandidates[activeMentionIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMention(null);
        return;
      }

      console.log("draft", draft);
    }

    // Enter sends; Shift+Enter adds a line. Ignore Enter while composing (IME).
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  // "Seen" goes under my last confirmed message once the other person has
  // read past it.
  const seenMessageId = useMemo(() => {
    if (!isDirect || !room.otherLastReadAt) return null;
    const lastMine = [...messages]
      .reverse()
      .find((m) => m.senderId._id === currentUserId && !m.status);
    if (!lastMine) return null;
    return new Date(room.otherLastReadAt) >= new Date(lastMine.createdAt)
      ? lastMine._id
      : null;
  }, [isDirect, room.otherLastReadAt, messages, currentUserId]);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3 sm:px-6">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to conversations"
          className="-ml-1 rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        {/* The whole identity block opens the info panel, like WhatsApp. */}
        <button
          type="button"
          onClick={onOpenInfo}
          aria-label={isDirect ? "View contact info" : "View channel info"}
          aria-expanded={infoOpen}
          className="-my-1 flex min-w-0 flex-1 items-center gap-3 rounded-lg py-1 text-left hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
        >
        {isDirect ? (
          <>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700">
              {initials(room.otherUser?.name)}
            </span>
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-slate-800">{roomTitle(room)}</h3>
              <p className="truncate text-xs text-slate-500">
                {typingName ? (
                  <span className="text-purple-600">typing…</span>
                ) : (
                  roleLabel(room.otherUser?.role)
                )}
              </p>
            </div>
          </>
        ) : (
          <>
            <Hash className="h-5 w-5 shrink-0 text-purple-600" />
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-slate-800">{roomTitle(room)}</h3>
              <p className="truncate text-xs text-slate-500">
                {room.participants.length}{" "}
                {room.participants.length === 1 ? "member" : "members"}
              </p>
            </div>
          </>
        )}
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-slate-50/50 px-3 py-4 sm:px-6"
        aria-live="polite"
      >
        {isFetchingNextPage && (
          <p className="pb-3 text-center text-xs text-slate-400">Loading older messages…</p>
        )}
        {isLoading && (
          <p className="text-center text-xs text-slate-400">Loading messages…</p>
        )}
        {isError && (
          <p className="text-center text-sm text-slate-500">
            Couldn't load messages. Reopen the conversation to try again.
          </p>
        )}
        {!isLoading && !isError && messages.length === 0 && isDirect && (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
            <p className="text-sm font-medium text-slate-600">No messages yet</p>
            <p className="text-xs text-slate-400">
              {isDirect && !readOnly
                ? `Say hello to ${roomTitle(room)}.`
                : "Messages will appear here."}
            </p>
          </div>
        )}

        {/* Start of a channel: say what it is and who made it. */}
        {!isLoading && !isError && !hasNextPage && !isDirect && (
          <div className="mb-2 flex flex-col items-center gap-1 px-4 pb-2 pt-4 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
              <Hash className="h-6 w-6" aria-hidden="true" />
            </span>
            <h4 className="mt-1 text-base font-semibold text-slate-900">
              Welcome to #{roomTitle(room)}
            </h4>
            <p className="max-w-sm text-sm text-slate-600">
              {room.createdBy === currentUserId
                ? "You created this channel"
                : creatorName
                  ? `${creatorName} added you to #${roomTitle(room)}`
                  : `You were added to #${roomTitle(room)}`}
            </p>
            {room.createdAt && (
              <p className="text-xs text-slate-500">
                {new Date(room.createdAt).toLocaleDateString([], {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        )}

        {messages.map((msg, i) => {
          // The welcome block above already says who created/added you, so
          // the channel's first event line isn't repeated in the thread.
          const introShown = !hasNextPage && !isDirect;
          const firstIsIntro = introShown && messages[0]?.kind === "SYSTEM";
          if (i === 0 && firstIsIntro) return null;

          const isMe = msg.senderId._id === currentUserId;
          const newDay =
            i === 0 ||
            (i === 1 && firstIsIntro) ||
            !isSameDay(messages[i - 1].createdAt, msg.createdAt);
          const header = startsGroup(messages, i);

          const daySeparator = newDay && (
            <div className="my-4 flex items-center gap-3" role="separator">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-[11px] font-medium text-slate-500">
                {dayLabel(msg.createdAt)}
              </span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>
          );

          // Event lines ("X created this channel") sit centered, not in a bubble.
          if (msg.kind === "SYSTEM") {
            return (
              <Fragment key={msg._id}>
                {daySeparator}
                <p className="my-3 text-center text-xs text-slate-500">{msg.content}</p>
              </Fragment>
            );
          }

          return (
            <Fragment key={msg._id}>
              {daySeparator}
              <div
                className={`flex flex-col ${isMe ? "items-end" : "items-start"} ${
                  header ? "mt-3" : "mt-0.5"
                }`}
              >
                {header && (
                  <div className="mb-1 flex items-center gap-2">
                    {!isDirect && !isMe && (
                      <span className="text-xs font-semibold text-slate-600">
                        {msg.senderId.name}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">
                      {timeLabel(msg.createdAt)}
                    </span>
                  </div>
                )}
                <div
                  className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-sm sm:max-w-md ${
                    isMe
                      ? "bg-purple-600 text-white"
                      : "border border-slate-200 bg-white text-slate-800 shadow-sm"
                  } ${msg.status === "sending" ? "opacity-60" : ""} ${
                    msg.status === "failed" ? "bg-red-50 text-red-900 ring-1 ring-red-300" : ""
                  }`}
                >
                  <MessageContent
                    content={msg.content}
                    members={room.participants}
                    currentUserId={currentUserId}
                    onDarkBubble={isMe && msg.status !== "failed"}
                  />
                </div>
                {msg.status === "sending" && (
                  <span className="mt-0.5 text-[10px] text-slate-400">Sending…</span>
                )}
                {msg.status === "failed" && (
                  <span className="mt-1 flex items-center gap-2 text-[11px] text-red-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Not sent
                    <button
                      type="button"
                      onClick={() => onRetry(msg)}
                      className="font-semibold underline hover:text-red-800"
                    >
                      Retry
                    </button>
                    <button
                      type="button"
                      onClick={() => onDiscard(msg)}
                      className="text-slate-500 underline hover:text-slate-700"
                    >
                      Delete
                    </button>
                  </span>
                )}
                {msg._id === seenMessageId && (
                  <span className="mt-0.5 text-[10px] text-slate-400">Seen</span>
                )}
              </div>
            </Fragment>
          );
        })}

        {typingName && !isDirect && (
          <p className="mt-3 text-xs text-slate-400">{typingName} is typing…</p>
        )}
      </div>

      {/* Composer */}
      {readOnly ? (
        <div className="flex items-center gap-2 border-t border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
          <Lock className="h-4 w-4 shrink-0 text-slate-400" />
          Direct messages are turned off for this conversation. You can still
          read past messages.
        </div>
      ) : (
        <form
          onSubmit={submit}
          className="relative flex items-end gap-2 border-t border-slate-200 bg-white p-3 sm:gap-3 sm:p-4"
        >
          {mentionOpen && (
            <MentionPopover
              candidates={mentionCandidates}
              activeIndex={activeMentionIndex}
              anchor={mentionAnchor}
              onPick={pickMention}
              onHover={setMentionIndex}
            />
          )}
          <label htmlFor="chat-composer" className="sr-only">
            Message {roomTitle(room)}
          </label>
          <textarea
            id="chat-composer"
            ref={composerRef}
            rows={1}
            value={draft}
            maxLength={MAX_MESSAGE_LENGTH}
            role="combobox"
            aria-expanded={mentionOpen}
            aria-controls={mentionOpen ? "mention-listbox" : undefined}
            aria-activedescendant={
              mentionOpen
                ? mentionOptionId(mentionCandidates[activeMentionIndex]._id)
                : undefined
            }
            onChange={(e) => {
              onDraftChange(e.target.value);
              updateMention(e.target.value, e.target.selectionStart);
              if (e.target.value) onTyping();
            }}
            onClick={(e) =>
              updateMention(e.currentTarget.value, e.currentTarget.selectionStart)
            }
            onBlur={() => {
              console.log("[mention] blur -> closing"); // TODO(debug): remove
              setMention(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${roomTitle(room)}`}
            className="max-h-36 min-h-[42px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="flex h-[42px] items-center gap-2 rounded-xl bg-purple-600 px-4 font-medium text-white shadow-sm transition hover:bg-purple-700 disabled:opacity-50 sm:px-5"
          >
            <span className="hidden sm:inline">Send</span>
            <Send className="h-4 w-4" />
          </button>
        </form>
      )}
    </div>
  );
};

export default Conversation;
