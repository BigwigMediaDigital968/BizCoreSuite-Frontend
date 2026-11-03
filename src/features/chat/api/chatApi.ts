import { apiClient } from "@/services/apiClient";
import type {
  ChatParticipant,
  ChatRoom,
  ChatMessagePage,
  RoomType,
} from "@/types/chat";

export const getMyRooms = async (): Promise<ChatRoom[]> => {
  const res = await apiClient.get("/chat/rooms");
  return res.data.data;
};

/** One page of history, oldest first. `before` = load older than this id. */
export const getRoomMessages = async (
  roomId: string,
  before?: string
): Promise<ChatMessagePage> => {
  const res = await apiClient.get(`/chat/rooms/${roomId}/messages`, {
    params: { before },
  });
  return { messages: res.data.data, hasMore: !!res.data.hasMore };
};

export const markRoomRead = async (roomId: string): Promise<void> => {
  await apiClient.post(`/chat/rooms/${roomId}/read`);
};

export interface ChatUsersResult {
  users: ChatParticipant[];
  /** False when the current user's own direct messages are turned off. */
  canDirectMessage: boolean;
}

export const getChatUsers = async (search?: string): Promise<ChatUsersResult> => {
  const res = await apiClient.get("/chat/users", {
    params: { search: search || undefined },
  });
  return { users: res.data.data, canDirectMessage: res.data.canDirectMessage };
};

export const getOrCreateDirectRoom = async (
  targetUserId: string
): Promise<ChatRoom> => {
  const res = await apiClient.post("/chat/direct", { targetUserId });
  return res.data.data;
};

export interface ChatSettings {
  canDirectMessage: boolean;
}

export const getUserChatSettings = async (
  userId: string
): Promise<ChatSettings> => {
  const res = await apiClient.get(`/chat/users/${userId}/settings`);
  return res.data.data;
};

export const updateUserChatSettings = async (
  userId: string,
  settings: ChatSettings
): Promise<ChatSettings> => {
  const res = await apiClient.patch(`/chat/users/${userId}/settings`, settings);
  return res.data.data;
};

export type ChannelType = Extract<RoomType, "GLOBAL" | "BRANCH">;

export const createChannel = async (payload: {
  name: string;
  type: ChannelType;
  branchId?: string;
}): Promise<ChatRoom> => {
  const res = await apiClient.post("/chat/channel", payload);
  return res.data.data;
};
