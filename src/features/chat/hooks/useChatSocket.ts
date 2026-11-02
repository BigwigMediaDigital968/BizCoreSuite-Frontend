import { useEffect } from "react";
import { socket } from "@/lib/socket";
import type { ChatMessage } from "@/types/chat";

export const useChatSocket = (
  activeRoomId: string | null,
  onNewMessage: (msg: ChatMessage) => void
) => {
  useEffect(() => {
    if (!activeRoomId) return;

    socket.emit("chat:join", activeRoomId);

    const handleNewMessage = (message: ChatMessage) => {
      if (message.roomId === activeRoomId) {
        onNewMessage(message);
      }
    };

    socket.on("chat:new_message", handleNewMessage);

    return () => {
      socket.emit("chat:leave", activeRoomId);
      socket.off("chat:new_message", handleNewMessage);
    };
  }, [activeRoomId, onNewMessage]);

  const sendMessage = (roomId: string, content: string) => {
    socket.emit("chat:send_message", { roomId, content });
  };

  return { sendMessage };
};