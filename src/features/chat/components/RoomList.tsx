import { Hash } from "lucide-react";
import type { ChatRoom } from "@/types/chat";
import { initials, listTimeLabel, roomTitle } from "../utils/format";
import { mentionsToPlainText } from "../utils/mentions";

interface RoomListProps {
  rooms: ChatRoom[];
  activeRoomId: string | null;
  currentUserId?: string;
  onSelect: (room: ChatRoom) => void;
}

const RoomButton = ({
  room,
  active,
  currentUserId,
  onSelect,
}: {
  room: ChatRoom;
  active: boolean;
  currentUserId?: string;
  onSelect: (room: ChatRoom) => void;
}) => {
  const unread = room.unreadCount > 0;
  const preview = room.lastMessage
    ? `${
        room.lastMessage.senderId === currentUserId && !room.lastMessage.isSystem
          ? "You: "
          : ""
      }${mentionsToPlainText(room.lastMessage.content)}`
    : room.type === "DIRECT"
      ? "No messages yet"
      : "";

  return (
    <button
      type="button"
      onClick={() => onSelect(room)}
      aria-current={active ? "true" : undefined}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition ${
        active ? "bg-purple-100" : "hover:bg-slate-100"
      }`}
    >
      {room.type === "DIRECT" ? (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700 ring-1 ring-white">
          {initials(room.otherUser?.name)}
        </span>
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-purple-500 ring-1 ring-slate-200">
          <Hash className="h-4 w-4" />
        </span>
      )}

      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span
            className={`truncate text-sm ${
              unread ? "font-semibold text-slate-900" : "font-medium text-slate-700"
            } ${active ? "text-purple-800" : ""}`}
          >
            {roomTitle(room)}
          </span>
          {room.lastMessageAt && (
            <span
              className={`shrink-0 text-[11px] ${unread ? "font-semibold text-purple-700" : "text-slate-400"}`}
            >
              {listTimeLabel(room.lastMessageAt)}
            </span>
          )}
        </span>
        {(preview || unread) && (
          <span className="mt-0.5 flex items-center justify-between gap-2">
            <span
              className={`truncate text-xs ${unread ? "text-slate-700" : "text-slate-500"}`}
            >
              {preview}
            </span>
            {unread && (
              <span
                className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-purple-600 px-1.5 text-[10px] font-bold text-white"
                aria-label={`${room.unreadCount} unread`}
              >
                {room.unreadCount > 99 ? "99+" : room.unreadCount}
              </span>
            )}
          </span>
        )}
      </span>
    </button>
  );
};

const RoomList = ({ rooms, activeRoomId, currentUserId, onSelect }: RoomListProps) => {
  const channels = rooms.filter((r) => r.type !== "DIRECT");
  const directs = rooms.filter((r) => r.type === "DIRECT");

  const section = (title: string, list: ChatRoom[], empty: string) => (
    <div>
      <div className="px-3 py-1 text-xs font-semibold uppercase text-slate-400">
        {title}
      </div>
      {list.length === 0 ? (
        <p className="px-3 py-2 text-xs text-slate-400">{empty}</p>
      ) : (
        <div className="space-y-0.5">
          {list.map((room) => (
            <RoomButton
              key={room._id}
              room={room}
              active={room._id === activeRoomId}
              currentUserId={currentUserId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {section("Direct messages", directs, "No conversations yet")}
      {section("Channels", channels, "You're not in any channels")}
    </div>
  );
};

export default RoomList;
