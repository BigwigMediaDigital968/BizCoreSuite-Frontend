import {
  Fragment,
  useLayoutEffect,
  useMemo,
  useRef,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { AlertCircle, ArrowLeft, Hash, Lock, Send } from "lucide-react";
import type { ChatMessage, ChatRoom } from "@/types/chat";
import { useRoomMessages } from "../hooks/useChat";
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
}

const startsGroup = (messages: ChatMessage[], i: number) => {
  if (i === 0) return true;
  const prev = messages[i - 1];
  const cur = messages[i];
  return (
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
}: ConversationProps) => {
  const isDirect = room.type === "DIRECT";
  const readOnly = isDirect && !!room.readOnly;

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

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const content = draft.trim();
    if (!content || readOnly) return;
    stickToBottom.current = true;
    onSend(content);
    onDraftChange("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
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
        {!isLoading && !isError && messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
            <p className="text-sm font-medium text-slate-600">No messages yet</p>
            <p className="text-xs text-slate-400">
              {isDirect && !readOnly
                ? `Say hello to ${roomTitle(room)}.`
                : "Messages will appear here."}
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.senderId._id === currentUserId;
          const newDay = i === 0 || !isSameDay(messages[i - 1].createdAt, msg.createdAt);
          const header = startsGroup(messages, i);

          return (
            <Fragment key={msg._id}>
              {newDay && (
                <div className="my-4 flex items-center gap-3" role="separator">
                  <span className="h-px flex-1 bg-slate-200" />
                  <span className="text-[11px] font-medium text-slate-500">
                    {dayLabel(msg.createdAt)}
                  </span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
              )}
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
                  {msg.content}
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
          className="flex items-end gap-2 border-t border-slate-200 bg-white p-3 sm:gap-3 sm:p-4"
        >
          <label htmlFor="chat-composer" className="sr-only">
            Message {roomTitle(room)}
          </label>
          <textarea
            id="chat-composer"
            ref={composerRef}
            rows={1}
            value={draft}
            maxLength={MAX_MESSAGE_LENGTH}
            onChange={(e) => {
              onDraftChange(e.target.value);
              if (e.target.value) onTyping();
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
