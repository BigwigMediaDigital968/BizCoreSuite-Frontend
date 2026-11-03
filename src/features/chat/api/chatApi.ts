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
  /** The members (besides the creator). Omit to let the server pick by type. */
  participants?: string[];
}): Promise<ChatRoom> => {
  const res = await apiClient.post("/chat/channel", payload);
  return res.data.data;
};

/** A person who can be added to a channel, with what the picker filters by. */
export interface ChannelCandidate extends ChatParticipant {
  branches: { _id: string; name: string }[];
}

export const getChannelCandidates = async (): Promise<ChannelCandidate[]> => {
  const res = await apiClient.get("/chat/channel-candidates");
  return res.data.data;
};

/** A person in a room's info panel, with where they work. */
export interface RoomPerson extends ChatParticipant {
  isActive: boolean;
  branches: { _id: string; name: string }[];
}

export interface RoomInfo {
  _id: string;
  name?: string;
  type: RoomType;
  createdBy?: string;
  createdAt: string;
  branch?: { _id: string; name: string };
  participants: RoomPerson[];
}

export const getRoomInfo = async (roomId: string): Promise<RoomInfo> => {
  const res = await apiClient.get(`/chat/rooms/${roomId}/info`);
  return res.data.data;
};

export const leaveRoom = async (roomId: string): Promise<void> => {
  await apiClient.post(`/chat/rooms/${roomId}/leave`);
};

export const addRoomMembers = async (
  roomId: string,
  userIds: string[]
): Promise<{ added: number }> => {
  const res = await apiClient.post(`/chat/rooms/${roomId}/members`, { userIds });
  return res.data.data;
};

export const removeRoomMember = async (
  roomId: string,
  userId: string
): Promise<void> => {
  await apiClient.delete(`/chat/rooms/${roomId}/members/${userId}`);
};
