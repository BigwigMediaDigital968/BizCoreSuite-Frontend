import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { MessageSquarePlus, Plus, Search } from "lucide-react";
import type { ChatMessage, ChatRoom } from "@/types/chat";
import { ROUTES } from "@/config/routes";
import {
  useChatRooms,
  useMarkRoomRead,
  useOpenDirectRoom,
} from "../hooks/useChat";
import { useChatSocket } from "../hooks/useChatSocket";
import CreateChannelModal from "../components/CreateChannelModal";
import NewMessageModal from "../components/NewMessageModal";
import RoomList from "../components/RoomList";
import { roomTitle } from "../utils/format";
import Conversation from "../components/Conversation";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useChatStore } from "@/store/chat.store";
import { PERMISSIONS } from "@/types/auth";

const DESKTOP_QUERY = "(min-width: 768px)";

const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(
    () => window.matchMedia(DESKTOP_QUERY).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => setIsDesktop(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return isDesktop;
};

export const ChatPage = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const canManageChat = hasPermission(PERMISSIONS.CHAT_MANAGE);
  const isDesktop = useIsDesktop();

  const [createOpen, setCreateOpen] = useState(false);
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // Unsent text per conversation, kept while switching rooms.
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const { data: rooms = [], isLoading: roomsLoading, isError: roomsError } =
    useChatRooms();
  const markRead = useMarkRoomRead();

  // The open conversation lives in the URL so it can be linked to:
  //   /chat?room=<roomId>      any room (notifications use this)
  //   /chat/dm/<userId>        that person's direct message (mentions use this)
  // Desktop falls back to the most recent room; on phones no selection
  // means the room list is showing.
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userId: dmUserId } = useParams();
  const dmRoom = dmUserId
    ? rooms.find((r) => r.type === "DIRECT" && r.otherUser?._id === dmUserId)
    : undefined;
  // On a /chat/dm link whose room isn't in our list yet (first time talking).
  const openingDm = !!dmUserId && !dmRoom;

  const selectedRoomId = dmRoom?._id ?? searchParams.get("room");
  const activeRoom: ChatRoom | null = openingDm
    ? null
    : (rooms.find((r) => r._id === selectedRoomId) ??
      (isDesktop ? rooms[0] : null) ??
      null);
  const showConversation = !!activeRoom && (isDesktop || !!selectedRoomId);

  // Open or create the DM for /chat/dm/<userId>. The hook adds the new room
  // to the list, which turns `dmRoom` into a match.
  const { mutateAsync: openDirectRoom } = useOpenDirectRoom();
  const openedDmFor = useRef<string | null>(null);
  useEffect(() => {
    if (!dmUserId || roomsLoading || dmRoom) return;
    if (openedDmFor.current === dmUserId) return;
    openedDmFor.current = dmUserId;

    // Can't message yourself; the hook already toasts why other opens fail.
    if (dmUserId === user?._id) {
      navigate(ROUTES.chat, { replace: true });
      return;
    }
    openDirectRoom(dmUserId).catch(() => navigate(ROUTES.chat, { replace: true }));
  }, [dmUserId, dmRoom, roomsLoading, user?._id, openDirectRoom, navigate]);

  const selectRoom = (room: ChatRoom) =>
    navigate(`${ROUTES.chat}?room=${room._id}`, { replace: !!selectedRoomId });
  const goBack = () => navigate(ROUTES.chat);

  const { sendMessage, discardMessage, emitTyping, typing } = useChatSocket(
    rooms.filter((r) => r.type !== "DIRECT").map((r) => r._id)
  );

  // Tell the app-wide listeners which conversation is on screen.
  const setActiveRoomId = useChatStore((s) => s.setActiveRoomId);
  const visibleRoomId = showConversation ? activeRoom!._id : null;
  useEffect(() => {
    setActiveRoomId(visibleRoomId);
    return () => setActiveRoomId(null);
  }, [visibleRoomId, setActiveRoomId]);

  // Mark the open conversation read while the tab is visible.
  const activeUnread = showConversation ? activeRoom!.unreadCount : 0;
  const { mutate: markRoomRead } = markRead;
  useEffect(() => {
    if (!visibleRoomId) return;
    const markIfVisible = () => {
      if (document.visibilityState === "visible" && activeUnread > 0) {
        markRoomRead(visibleRoomId);
      }
    };
    markIfVisible();
    document.addEventListener("visibilitychange", markIfVisible);
    window.addEventListener("focus", markIfVisible);
    return () => {
      document.removeEventListener("visibilitychange", markIfVisible);
      window.removeEventListener("focus", markIfVisible);
    };
  }, [visibleRoomId, activeUnread, markRoomRead]);

  const query = searchQuery.trim().toLowerCase();
  const filteredRooms = query
    ? rooms.filter((r) => roomTitle(r).toLowerCase().includes(query))
    : rooms;

  const handleDraftChange = (value: string) =>
    setDrafts((prev) => ({ ...prev, [activeRoom!._id]: value }));

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden border border-slate-200 bg-white shadow-sm">
      {/* Conversations */}
      <div
        className={`w-full flex-col border-r border-slate-200 bg-slate-50 md:flex md:w-80 ${showConversation ? "hidden" : "flex"
          }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 p-4">
          <h2 className="text-lg font-bold text-slate-800">Internal Chat</h2>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setNewMessageOpen(true)}
              aria-label="New message"
              title="New message"
              className="rounded-lg bg-purple-600 p-1.5 text-white transition hover:bg-purple-700"
            >
              <MessageSquarePlus className="h-4 w-4" />
            </button>
            {canManageChat && (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                aria-label="Create channel"
                title="Create channel"
                className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 transition hover:bg-slate-100"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <label htmlFor="chat-room-search" className="sr-only">
              Search conversations
            </label>
            <input
              id="chat-room-search"
              type="search"
              placeholder="Search conversations"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {roomsLoading ? (
            <p className="px-3 py-2 text-sm text-slate-400">Loading chats…</p>
          ) : roomsError ? (
            <p className="px-3 py-2 text-sm text-slate-500">
              Couldn't load your chats. Refresh to try again.
            </p>
          ) : query && filteredRooms.length === 0 ? (
            <p className="px-3 py-2 text-sm text-slate-500">
              No conversations match "{searchQuery.trim()}".
            </p>
          ) : (
            <RoomList
              rooms={filteredRooms}
              activeRoomId={showConversation ? activeRoom!._id : null}
              currentUserId={user?._id}
              onSelect={selectRoom}
            />
          )}
        </div>
      </div>

      {/* Conversation */}
      {showConversation ? (
        <Conversation
          key={activeRoom!._id}
          room={activeRoom!}
          currentUserId={user?._id}
          typingName={typing[activeRoom!._id]}
          draft={drafts[activeRoom!._id] ?? ""}
          onDraftChange={handleDraftChange}
          onSend={(content) => sendMessage(activeRoom!._id, content)}
          onRetry={(msg: ChatMessage) =>
            msg.clientId && sendMessage(msg.roomId, msg.content, msg.clientId)
          }
          onDiscard={(msg: ChatMessage) =>
            msg.clientId && discardMessage(msg.roomId, msg.clientId)
          }
          onTyping={() => emitTyping(activeRoom!._id)}
          onBack={goBack}
        />
      ) : (
        <div className="hidden flex-1 flex-col items-center justify-center gap-3 text-center md:flex">
          {roomsLoading || openingDm ? (
            <p className="text-sm text-slate-400">Loading chats…</p>
          ) : (
            <>
              <p className="text-sm font-medium text-slate-600">No conversations yet</p>
              <button
                type="button"
                onClick={() => setNewMessageOpen(true)}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
              >
                Start a conversation
              </button>
            </>
          )}
        </div>
      )}

      <NewMessageModal
        open={newMessageOpen}
        onClose={() => setNewMessageOpen(false)}
        onOpened={selectRoom}
      />
      <CreateChannelModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={selectRoom}
      />
    </div>
  );
};
