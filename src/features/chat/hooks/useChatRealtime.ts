import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { connectSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/auth.store";
import type { ChatMessage, ChatRoom } from "@/types/chat";
import {
  chatKeys,
  sortRoomsInCache,
  updateRoomInCache,
  upsertMessageInCache,
} from "./useChat";

interface ReadEvent {
  roomId: string;
  userId: string;
  readAt: string;
}

/**
 * App-wide chat listeners, mounted once in the dashboard layout so the room
 * list, unread counts and history stay current on every page — not only
 * while the Chat page is open. DM events always reach the user's personal
 * socket room; channel messages arrive while the Chat page has joined them.
 */
export const useChatRealtime = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?._id);

  useEffect(() => {
    if (!userId) return;

    const socket = connectSocket(userId);

    const handleNewMessage = (message: ChatMessage) => {
      upsertMessageInCache(queryClient, message);

      const rooms = queryClient.getQueryData<ChatRoom[]>(chatKeys.rooms);
      if (rooms && !rooms.some((r) => r._id === message.roomId)) {
        // First message of a conversation we haven't seen yet.
        queryClient.invalidateQueries({ queryKey: chatKeys.rooms });
        return;
      }

      const mine = message.senderId._id === userId;
      updateRoomInCache(queryClient, message.roomId, (room) => ({
        ...room,
        lastMessage: {
          content: message.content,
          senderId: message.senderId._id,
          createdAt: message.createdAt,
        },
        lastMessageAt: message.createdAt,
        // The Chat page marks the open conversation read right away.
        unreadCount: mine ? room.unreadCount : room.unreadCount + 1,
      }));
      sortRoomsInCache(queryClient);
    };

    const handleRead = ({ roomId, userId: readerId, readAt }: ReadEvent) => {
      updateRoomInCache(queryClient, roomId, (room) =>
        readerId === userId
          ? { ...room, unreadCount: 0 } // Read in another tab.
          : { ...room, otherLastReadAt: readAt }
      );
    };

    const refreshRooms = () =>
      queryClient.invalidateQueries({ queryKey: chatKeys.rooms });

    // After a reconnect, re-sync whatever was missed while offline.
    let hasConnected = socket.connected;
    const handleConnect = () => {
      if (hasConnected) {
        queryClient.invalidateQueries({ queryKey: ["chat"] });
      }
      hasConnected = true;
    };

    socket.on("chat:new_message", handleNewMessage);
    socket.on("chat:read", handleRead);
    socket.on("chat:rooms_changed", refreshRooms);
    socket.on("connect", handleConnect);

    return () => {
      socket.off("chat:new_message", handleNewMessage);
      socket.off("chat:read", handleRead);
      socket.off("chat:rooms_changed", refreshRooms);
      socket.off("connect", handleConnect);
    };
  }, [userId, queryClient]);
};
