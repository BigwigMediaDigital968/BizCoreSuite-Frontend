import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { connectSocket, getSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/auth.store";
import type { ChatMessage } from "@/types/chat";
import { updateOptimisticMessage, upsertMessageInCache } from "./useChat";

const SEND_TIMEOUT_MS = 10_000;
const TYPING_EMIT_INTERVAL_MS = 2_000;
const TYPING_DISPLAY_MS = 3_500;

interface TypingEvent {
  roomId: string;
  userId: string;
  name: string;
}

type SendAck = { ok: boolean; message?: string; data?: ChatMessage };

const newClientId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/**
 * Chat-page socket work: joins channel rooms (DMs arrive on the user's own
 * socket room), tracks who is typing, and sends messages optimistically.
 * Incoming messages are handled app-wide by useChatRealtime.
 */
export const useChatSocket = (channelIds: string[]) => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const userId = user?._id;

  // roomId -> name of the person typing there
  const [typing, setTyping] = useState<Record<string, string>>({});
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const lastTypingEmit = useRef<Record<string, number>>({});

  // Stable dependency: only re-subscribe when the set of rooms changes.
  const roomKey = [...channelIds].sort().join(",");

  useEffect(() => {
    if (!userId || !roomKey) return;

    const socket = connectSocket(userId);
    const ids = roomKey.split(",");

    // Rooms are left on disconnect, so join again after every (re)connect.
    const joinAll = () => ids.forEach((id) => socket.emit("chat:join", id));
    if (socket.connected) joinAll();
    socket.on("connect", joinAll);

    return () => {
      ids.forEach((id) => socket.emit("chat:leave", id));
      socket.off("connect", joinAll);
    };
  }, [roomKey, userId]);

  useEffect(() => {
    if (!userId) return;
    const socket = connectSocket(userId);
    const timers = typingTimers.current;

    const clearTyping = (roomId: string) =>
      setTyping((prev) => {
        const next = { ...prev };
        delete next[roomId];
        return next;
      });

    const handleTyping = ({ roomId, userId: typistId, name }: TypingEvent) => {
      if (typistId === userId) return;
      setTyping((prev) => ({ ...prev, [roomId]: name }));
      clearTimeout(timers[roomId]);
      timers[roomId] = setTimeout(() => clearTyping(roomId), TYPING_DISPLAY_MS);
    };

    // A message from the typist ends their "typing…".
    const handleMessage = (message: ChatMessage) => {
      if (message.senderId._id !== userId) {
        clearTimeout(timers[message.roomId]);
        clearTyping(message.roomId);
      }
    };

    const handleError = (err: { message?: string }) => {
      toast.error(err?.message || "Chat error");
    };

    socket.on("chat:typing", handleTyping);
    socket.on("chat:new_message", handleMessage);
    socket.on("chat:error", handleError);

    return () => {
      socket.off("chat:typing", handleTyping);
      socket.off("chat:new_message", handleMessage);
      socket.off("chat:error", handleError);
      Object.values(timers).forEach(clearTimeout);
    };
  }, [userId]);

  const emitTyping = useCallback((roomId: string) => {
    const socket = getSocket();
    const now = Date.now();
    if (!socket?.connected) return;
    if (now - (lastTypingEmit.current[roomId] ?? 0) < TYPING_EMIT_INTERVAL_MS) return;
    lastTypingEmit.current[roomId] = now;
    socket.emit("chat:typing", { roomId });
  }, []);

  /** Shows the message immediately as "sending", then confirms or fails it. */
  const sendMessage = useCallback(
    (roomId: string, content: string, retryOf?: string) => {
      if (!user) return;

      const clientId = retryOf ?? newClientId();
      if (retryOf) {
        updateOptimisticMessage(queryClient, roomId, clientId, (m) => ({
          ...m,
          status: "sending",
        }));
      } else {
        upsertMessageInCache(queryClient, {
          _id: `local-${clientId}`,
          clientId,
          roomId,
          content,
          createdAt: new Date().toISOString(),
          senderId: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          status: "sending",
        });
      }

      const markFailed = () =>
        updateOptimisticMessage(queryClient, roomId, clientId, (m) => ({
          ...m,
          status: "failed",
        }));

      const socket = getSocket();
      if (!socket?.connected) {
        markFailed();
        return;
      }

      socket
        .timeout(SEND_TIMEOUT_MS)
        .emit(
          "chat:send_message",
          { roomId, content, clientId },
          (err: Error | null, res?: SendAck) => {
            if (err || !res?.ok || !res.data) {
              markFailed();
              return;
            }
            upsertMessageInCache(queryClient, res.data);
          }
        );
    },
    [queryClient, user]
  );

  const discardMessage = useCallback(
    (roomId: string, clientId: string) =>
      updateOptimisticMessage(queryClient, roomId, clientId, () => null),
    [queryClient]
  );

  return { sendMessage, discardMessage, emitTyping, typing };
};
