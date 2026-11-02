import { apiClient } from "@/services/apiClient";
import type { ChatRoom, ChatMessage, RoomType } from "@/types/chat";

export const getMyRooms = async (): Promise<ChatRoom[]> => {
  const res = await apiClient.get("/chat/rooms");
  return res.data.data;
};

export const getRoomMessages = async (
  roomId: string
): Promise<ChatMessage[]> => {
  const res = await apiClient.get(`/chat/rooms/${roomId}/messages`);
  return res.data.data;
};

export const getOrCreateDirectRoom = async (
  targetUserId: string
): Promise<ChatRoom> => {
  const res = await apiClient.post("/chat/direct", { targetUserId });
  return res.data.data;
};

export const createChannel = async (payload: {
  name: string;
  type: RoomType;
  branchId?: string;
  allowedRoles?: string[];
}): Promise<ChatRoom> => {
  const res = await apiClient.post("/chat/channel", payload);
  return res.data.data;
};